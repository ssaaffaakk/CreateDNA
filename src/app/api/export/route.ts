import { NextRequest, NextResponse } from "next/server";
import type { StyleDNA } from "@/lib/style-dna";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { styleDNA, format } = body as {
      styleDNA: StyleDNA;
      format: "json" | "markdown" | "system-prompt";
    };

    if (!styleDNA) {
      return NextResponse.json({ error: "No styleDNA" }, { status: 400 });
    }

    switch (format) {
      case "json":
        return NextResponse.json({ export: styleDNA });

      case "markdown":
        return NextResponse.json({ export: toMarkdown(styleDNA) });

      case "system-prompt":
        return NextResponse.json({ export: toSystemPrompt(styleDNA) });

      default:
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function toMarkdown(dna: StyleDNA): string {
  return `# Creative DNA Profile

## Summary
${dna.summary}

## Color Palette
${dna.palette.map((c) => `- **${c.name}** \`${c.hex}\` (${Math.round(c.weight * 100)}%)`).join("\n")}

## Composition
${dna.composition.map((c) => `- ${c}`).join("\n")}

## Style Influences
${dna.styles.map((s) => `- **${s.name}** — ${Math.round(s.weight * 100)}%`).join("\n")}

## Mood & Tone
${dna.mood.join(", ")}

## Techniques
${dna.techniques.join(", ")}

## Influences
${dna.influences.join(", ")}

---
*Generated from ${dna.imageCount} portfolio pieces*
*Last updated: ${dna.updatedAt}*`;
}

function toSystemPrompt(dna: StyleDNA): string {
  return `You are acting as a creative assistant for a specific creator. Here is their creative identity:

${dna.summary}

Their dominant colors: ${dna.palette.slice(0, 5).map((c) => `${c.name} (${c.hex})`).join(", ")}
Their composition style: ${dna.composition.join(", ")}
Their artistic influences: ${dna.styles.map((s) => s.name).join(", ")}
Their mood/tone: ${dna.mood.join(", ")}
Their techniques: ${dna.techniques.join(", ")}

IMPORTANT: Every output you generate must be consistent with this creator's identity. Match their aesthetic, tone, and visual language. If they favor minimalism, don't produce maximalist work. If they use warm palettes, don't default to cool tones. Be THEM, not generic.`;
}
