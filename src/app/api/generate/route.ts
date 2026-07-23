import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/granite";
import type { StyleDNA } from "@/lib/style-dna";
import type { ProjectBrief } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { styleDNA, brief } = body as {
      styleDNA: StyleDNA;
      brief: ProjectBrief;
    };

    if (!styleDNA || !brief) {
      return NextResponse.json(
        { error: "Missing styleDNA or brief" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(styleDNA);
    const userPrompt = buildUserPrompt(brief);

    const raw = await generateText(systemPrompt, userPrompt);

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

    return NextResponse.json({ output: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSystemPrompt(dna: StyleDNA): string {
  return `You are a creative director AI that deeply understands a specific creator's style.

Here is their Creative DNA profile:

STYLE SUMMARY: ${dna.summary}

COLOR PALETTE: ${dna.palette.map((c) => `${c.name} (${c.hex}, weight: ${c.weight})`).join(", ")}

COMPOSITION TRAITS: ${dna.composition.join(", ")}

STYLE INFLUENCES: ${dna.styles.map((s) => `${s.name} (${s.weight})`).join(", ")}

MOOD/TONE: ${dna.mood.join(", ")}

TECHNIQUES: ${dna.techniques.join(", ")}

INFLUENCES: ${dna.influences.join(", ")}

You must generate creative guidance that is CONSISTENT with this creator's identity. Every suggestion should feel like it came from THEM, not from a generic AI.

Respond ONLY with valid JSON, no markdown, no explanation.`;
}

function buildUserPrompt(brief: ProjectBrief): string {
  return `New project brief:
- Description: ${brief.description}
- Platform: ${brief.platform}
- Target audience: ${brief.audience}
- Constraints: ${brief.constraints}

Based on MY creative DNA, generate a project preparation kit:

{
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "typography": "Recommended font pairing and why it fits my style",
  "tone": "Writing tone guide based on my creative identity",
  "moodboard": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "brief": "A rewritten brief that incorporates my style DNA — as if I wrote it myself",
  "prompts": [
    {"tool": "Midjourney", "prompt": "A ready-to-use prompt incorporating my style DNA"},
    {"tool": "DALL-E", "prompt": "A ready-to-use prompt incorporating my style DNA"},
    {"tool": "ChatGPT", "prompt": "A system prompt that makes ChatGPT write in my creative voice"},
    {"tool": "Canva", "prompt": "Style guidelines for Canva design"}
  ]
}`;
}
