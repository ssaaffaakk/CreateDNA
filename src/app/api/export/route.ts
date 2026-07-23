import { NextRequest, NextResponse } from "next/server";
import type { StyleDNA } from "@/lib/style-dna";
import { toClientError } from "@/lib/api-error";
import { tooLarge } from "@/lib/request-guard";

const MAX_BODY_BYTES = 512 * 1024;

export async function POST(req: NextRequest) {
  try {
    const oversized = tooLarge(req, MAX_BODY_BYTES);
    if (oversized) return oversized;

    const body = await req.json();
    const { styleDNA, format } = body as {
      styleDNA: StyleDNA;
      format: "json" | "markdown" | "system-prompt";
    };

    // The formatters map over these arrays; a malformed DNA previously threw
    // and leaked the raw TypeError to the client as a 500.
    const isUsableDNA =
      styleDNA !== null &&
      typeof styleDNA === "object" &&
      (["palette", "composition", "styles", "mood", "techniques", "influences"] as const).every(
        (k) => Array.isArray((styleDNA as unknown as Record<string, unknown>)[k])
      );

    if (!isUsableDNA) {
      return NextResponse.json(
        { error: "Invalid or incomplete styleDNA" },
        { status: 400 }
      );
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
    return NextResponse.json(...toClientError(error, "Export failed"));
  }
}

function toMarkdown(dna: StyleDNA): string {
  return `# Creative DNA Profile

> Generated from ${dna.imageCount} portfolio piece${dna.imageCount !== 1 ? "s" : ""} · Consistency: ${dna.consistencyScore}%

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
*Last updated: ${dna.updatedAt}*
*Created with [CreateDNA](https://github.com/ssaaffaakk/CreateDNA) — Powered by IBM Granite on watsonx.ai*`;
}

function toSystemPrompt(dna: StyleDNA): string {
  return `You are acting as a creative assistant for a specific creator. You have analyzed ${dna.imageCount} of their portfolio pieces and deeply understand their visual identity.

## Their Creative DNA

${dna.summary}

## Style Details

- Dominant colors: ${dna.palette.slice(0, 5).map((c) => `${c.name} (${c.hex})`).join(", ")}
- Composition style: ${dna.composition.join(", ")}
- Artistic influences: ${dna.styles.map((s) => `${s.name} (${Math.round(s.weight * 100)}%)`).join(", ")}
- Mood/tone: ${dna.mood.join(", ")}
- Techniques: ${dna.techniques.join(", ")}
- Style consistency: ${dna.consistencyScore}%

## Rules

Every output you generate MUST be consistent with this creator's identity:
- Match their color palette — extend it, don't replace it
- Match their composition preferences
- Match their mood and emotional tone
- If they favor minimalism, don't produce maximalist work
- If they use warm palettes, don't default to cool tones
- Be THEM, not generic

Generated with CreateDNA — Powered by IBM Granite on watsonx.ai`;
}
