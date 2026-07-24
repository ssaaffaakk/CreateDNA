import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/granite";
import { ANALYSIS_PROMPT, mergeStyleDNA } from "@/lib/style-dna";
import type { StyleDNA } from "@/lib/style-dna";
import { toClientError } from "@/lib/api-error";
import { tooLarge } from "@/lib/request-guard";
import { nameColor } from "@/lib/palette";

const MAX_BASE64_SIZE = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const oversized = tooLarge(req, MAX_BASE64_SIZE + 1024 * 1024);
    if (oversized) return oversized;

    const body = await req.json();
    const { imageBase64, existingDNA, sampledPalette } = body as {
      imageBase64: string;
      existingDNA: StyleDNA | null;
      sampledPalette?: { hex: string; weight: number }[];
    };

    // Type check, not just truthiness: a non-string here would otherwise skip
    // the length guard and reach the paid vision call as "[object Object]".
    if (typeof imageBase64 !== "string" || !imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: "Image too large (max ~10MB)" }, { status: 400 });
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

    // Vision models estimate hex codes from impression, not by sampling
    // pixels, so their palettes drift. When the client sends real
    // pixel-sampled colors, use those (named from the true hue) instead.
    const realColors = sanitizeSampledPalette(sampledPalette);
    if (realColors.length) {
      (parsed as Record<string, unknown>).palette = realColors.map((c) => ({
        hex: c.hex,
        weight: c.weight,
        name: nameColor(c.hex),
      }));
    }

    const updatedDNA = mergeStyleDNA(existingDNA, parsed);

    return NextResponse.json({ dna: updatedDNA, analysis: parsed });
  } catch (error: unknown) {
    return NextResponse.json(...toClientError(error, "Analysis failed"));
  }
}

// The sampled palette is client-supplied, so validate every field before it
// reaches the persisted DNA: real 6-digit hex codes and finite weights only.
function sanitizeSampledPalette(
  value: unknown
): { hex: string; weight: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (c): c is { hex: string; weight: number } =>
        !!c &&
        typeof c === "object" &&
        typeof (c as { hex?: unknown }).hex === "string" &&
        /^#[0-9a-fA-F]{6}$/.test((c as { hex: string }).hex) &&
        typeof (c as { weight?: unknown }).weight === "number" &&
        Number.isFinite((c as { weight: number }).weight)
    )
    .slice(0, 8);
}
