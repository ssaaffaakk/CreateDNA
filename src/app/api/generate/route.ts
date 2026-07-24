import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/granite";
import { isUsableStyleDNA } from "@/lib/style-dna";
import type { StyleDNA } from "@/lib/style-dna";
import type { GeneratedOutput, ProjectBrief, PromptExport } from "@/lib/store";
import { toClientError } from "@/lib/api-error";
import { tooLarge, clampStrings } from "@/lib/request-guard";

const MAX_BODY_BYTES = 512 * 1024;
const MAX_DNA_STRING = 500;

export async function POST(req: NextRequest) {
  try {
    const oversized = tooLarge(req, MAX_BODY_BYTES);
    if (oversized) return oversized;

    const body = await req.json();
    const rawDNA = (body as { styleDNA?: unknown }).styleDNA;
    const brief = (body as { brief?: ProjectBrief }).brief;

    if (typeof brief?.description !== "string" || !brief.description) {
      return NextResponse.json(
        { error: "Missing brief description" },
        { status: 400 }
      );
    }

    // Without the structural check, garbage here throws inside
    // buildSystemPrompt and surfaces as a retryable 502 instead of a 400.
    if (!isUsableStyleDNA(rawDNA)) {
      return NextResponse.json(
        { error: "Invalid or incomplete styleDNA" },
        { status: 400 }
      );
    }

    // Every styleDNA string is interpolated into the system prompt. The brief
    // is length-checked below, so without this a caller could move an
    // arbitrary prompt into styleDNA.summary and bypass that cap entirely.
    const styleDNA: StyleDNA = clampStrings(rawDNA, MAX_DNA_STRING);

    const MAX_FIELD_LENGTH = 2000;
    if (brief.description.length > MAX_FIELD_LENGTH ||
        (brief.platform && brief.platform.length > MAX_FIELD_LENGTH) ||
        (brief.audience && brief.audience.length > MAX_FIELD_LENGTH) ||
        (brief.constraints && brief.constraints.length > MAX_FIELD_LENGTH)) {
      return NextResponse.json(
        { error: "Input too long (max 2000 characters per field)" },
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
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    // The kit is rendered as React children and persisted, so element types
    // matter, not just the arrays: an object in typography/tone crashes the
    // panel live ("Objects are not valid as a React child"), and a non-string
    // palette entry passes here only for sanitizeOutput to discard the whole
    // kit on the next reload. Mirror the store's read-path rules exactly.
    const isStringArray = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((s) => typeof s === "string");
    const isPromptList = (v: unknown): v is PromptExport[] =>
      Array.isArray(v) &&
      v.every(
        (p) =>
          typeof (p as { tool?: unknown })?.tool === "string" &&
          typeof (p as { prompt?: unknown })?.prompt === "string"
      );

    const kit = parsed as Record<string, unknown> | null;
    const kitBrief = kit?.brief;
    const kitPalette = kit?.palette;
    const kitMoodboard = kit?.moodboard;
    const kitPrompts = kit?.prompts;

    if (
      typeof kitBrief !== "string" ||
      !isStringArray(kitPalette) ||
      !isStringArray(kitMoodboard) ||
      !isPromptList(kitPrompts)
    ) {
      return NextResponse.json(
        { error: "AI returned an unexpected format — please retry" },
        { status: 502 }
      );
    }

    // Echo only the fields the panel expects — never extra model output.
    const output: GeneratedOutput = {
      brief: kitBrief,
      palette: kitPalette,
      moodboard: kitMoodboard,
      typography: typeof kit?.typography === "string" ? kit.typography : "",
      tone: typeof kit?.tone === "string" ? kit.tone : "",
      prompts: kitPrompts.map((p) => ({ tool: p.tool, prompt: p.prompt })),
    };

    return NextResponse.json({ output });
  } catch (error: unknown) {
    return NextResponse.json(...toClientError(error, "Generation failed"));
  }
}

function buildSystemPrompt(dna: StyleDNA): string {
  const topColors = dna.palette
    .slice(0, 5)
    .map((c) => `${c.name} (${c.hex}, weight: ${Math.round(c.weight * 100)}%)`)
    .join(", ");

  const topStyles = dna.styles
    .map((s) => `${s.name} (${Math.round(s.weight * 100)}%)`)
    .join(", ");

  return `You are a creative director AI that deeply understands a specific creator's style. You have analyzed ${dna.imageCount} of their portfolio pieces and built a comprehensive style profile.

CREATOR'S STYLE DNA:

Summary: ${dna.summary}

Color palette: ${topColors}

Composition: ${dna.composition.join(", ")}

Style influences: ${topStyles}

Mood/emotional tone: ${dna.mood.join(", ")}

Visual techniques: ${dna.techniques.join(", ")}

Creative influences: ${dna.influences.join(", ")}

Style consistency: ${dna.consistencyScore}% (${dna.consistencyScore >= 80 ? "highly focused — lean into their signature look" : dna.consistencyScore >= 50 ? "versatile — adapt to the project while keeping core identity" : "eclectic — find the thread that connects their work"})

RULES:
- Every suggestion MUST be consistent with this creator's visual identity
- Palette suggestions should extend their existing colors, not replace them
- Typography should match the energy and era of their style influences
- Prompts should be specific enough to reproduce their aesthetic
- Write as if you ARE this creator's creative director who knows them deeply
- Respond ONLY with valid JSON — no markdown fences, no explanation`;
}

function buildUserPrompt(brief: ProjectBrief): string {
  return `New project brief:
- Description: ${brief.description}
${brief.platform ? `- Platform: ${brief.platform}` : ""}
${brief.audience ? `- Target audience: ${brief.audience}` : ""}
${brief.constraints ? `- Constraints: ${brief.constraints}` : ""}

Generate a complete project preparation kit in MY style:

{
  "brief": "Rewrite the brief in my creative voice — as if I wrote it myself",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "typography": "Font pairing recommendation with reasoning tied to my style DNA",
  "tone": "Writing tone and voice guide based on my creative identity",
  "moodboard": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "prompts": [
    {"tool": "Midjourney", "prompt": "A detailed prompt that captures my visual style for this project"},
    {"tool": "DALL-E", "prompt": "A detailed prompt adapted for DALL-E that captures my aesthetic"},
    {"tool": "ChatGPT", "prompt": "A system prompt that makes ChatGPT write in my creative voice for this project"},
    {"tool": "Canva", "prompt": "Specific style guidelines for designing in Canva in my style"}
  ]
}`;
}
