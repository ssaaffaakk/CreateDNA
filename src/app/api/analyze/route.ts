import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/granite";
import { ANALYSIS_PROMPT, mergeStyleDNA } from "@/lib/style-dna";
import type { StyleDNA } from "@/lib/style-dna";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, existingDNA } = body as {
      imageBase64: string;
      existingDNA: StyleDNA | null;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const raw = await analyzeImage(imageBase64, ANALYSIS_PROMPT);

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw },
        { status: 500 }
      );
    }

    const updatedDNA = mergeStyleDNA(existingDNA, parsed);

    return NextResponse.json({ dna: updatedDNA, analysis: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Missing environment variable") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
