import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/granite";
import { ANALYSIS_PROMPT, isUsableStyleDNA, mergeStyleDNA } from "@/lib/style-dna";
import type { StyleDNA } from "@/lib/style-dna";
import { toClientError } from "@/lib/api-error";
import { tooLarge, clampStrings } from "@/lib/request-guard";

const MAX_BASE64_SIZE = 15 * 1024 * 1024;
const MAX_DNA_STRING = 500;
const MAX_IMAGE_COUNT = 10_000;

export async function POST(req: NextRequest) {
  try {
    const oversized = tooLarge(req, MAX_BASE64_SIZE + 1024 * 1024);
    if (oversized) return oversized;

    const body = await req.json();
    const { imageBase64 } = body as { imageBase64: string };
    const rawExistingDNA = (body as { existingDNA?: unknown }).existingDNA;

    // Type check, not just truthiness: a non-string here would otherwise skip
    // the length guard and reach the paid vision call as "[object Object]".
    if (typeof imageBase64 !== "string" || !imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: "Image too large (max ~10MB)" }, { status: 400 });
    }

    // existingDNA crosses the same trust boundary as /api/generate's styleDNA:
    // its summary is interpolated into the vision prompt below and the rest is
    // merged into the profile, so validate the shape and clamp every string —
    // otherwise the image-sized body allowance doubles as a prompt allowance.
    let existingDNA: StyleDNA | null = null;
    if (rawExistingDNA != null) {
      if (!isUsableStyleDNA(rawExistingDNA)) {
        return NextResponse.json(
          { error: "Invalid or incomplete existingDNA" },
          { status: 400 }
        );
      }
      const clamped = clampStrings(rawExistingDNA, MAX_DNA_STRING);
      existingDNA = {
        ...clamped,
        imageCount: Math.min(MAX_IMAGE_COUNT, Math.floor(clamped.imageCount)),
      };
    }

    // Ask the model to evolve the profile summary instead of describing only
    // the newest piece, so the accumulated DNA reads as one identity.
    const prompt = existingDNA?.summary
      ? `${ANALYSIS_PROMPT}\n\nContext: This creator's profile so far is described as: "${existingDNA.summary}" (based on ${existingDNA.imageCount} prior image(s)). For the "summary" field ONLY, write an updated description of the creator's OVERALL visual identity that blends that prior profile with this new piece. All other fields must describe this image alone.`
      : ANALYSIS_PROMPT;

    const raw = await analyzeImage(imageBase64, prompt);

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    // A refusal or partial object parses fine but would poison the persisted
    // DNA, so reject anything without the six required arrays.
    const ARRAY_KEYS = ["palette", "composition", "styles", "mood", "techniques", "influences"] as const;
    const candidate = parsed as Record<string, unknown> | null;
    const isValidAnalysis =
      candidate !== null &&
      typeof candidate === "object" &&
      ARRAY_KEYS.every((k) => Array.isArray(candidate[k])) &&
      (candidate.palette as unknown[]).every(
        (c) => typeof (c as { hex?: unknown })?.hex === "string"
      );

    if (!isValidAnalysis) {
      return NextResponse.json(
        { error: "AI returned an unexpected format — please retry" },
        { status: 502 }
      );
    }

    const updatedDNA = mergeStyleDNA(existingDNA, parsed);

    return NextResponse.json({ dna: updatedDNA, analysis: parsed });
  } catch (error: unknown) {
    return NextResponse.json(...toClientError(error, "Analysis failed"));
  }
}
