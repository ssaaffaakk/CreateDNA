import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/granite";
import { toClientError } from "@/lib/api-error";
import { tooLarge, clampStrings } from "@/lib/request-guard";

const MAX_BODY_BYTES = 64 * 1024;

/**
 * Turns the DETERMINISTIC on-brand analysis into a short human "creative
 * director's note" via IBM Granite. The score and reasons are computed from
 * pixels (consistent); the model only phrases the advice, grounded in those
 * measured signals — it never invents the verdict.
 */
export async function POST(req: NextRequest) {
  try {
    const oversized = tooLarge(req, MAX_BODY_BYTES);
    if (oversized) return oversized;

    const body = clampStrings(await req.json(), 400) as {
      score?: number;
      verdict?: string;
      reasons?: string[];
      matches?: string[];
      dnaSummary?: string;
    };

    const score = Math.max(0, Math.min(100, Math.round(Number(body.score) || 0)));
    const verdict = typeof body.verdict === "string" ? body.verdict : "";
    const reasons = Array.isArray(body.reasons)
      ? body.reasons.filter((r) => typeof r === "string").slice(0, 5)
      : [];
    const matches = Array.isArray(body.matches)
      ? body.matches.filter((m) => typeof m === "string").slice(0, 5)
      : [];
    const summary = typeof body.dnaSummary === "string" ? body.dnaSummary : "";

    const system = `You are a sharp, encouraging creative director judging whether a new piece is on-brand for a specific creator. You are given a MEASURED analysis — trust it, never contradict the score. Write EXACTLY one or two sentences: name what pulls the piece off-brand (or what is working when the score is high), then one concrete, actionable tip to bring it on brand. Ground every claim in the given signals. No preamble, no bullet points, no markdown, do not restate the number.`;

    const user = `Creator's identity: ${summary || "a distinctive, consistent visual style"}.
On-brand score: ${score}/100 (${verdict}).
Off-brand signals: ${reasons.length ? reasons.join("; ") : "none"}.
On-point dimensions: ${matches.length ? matches.join(", ") : "none"}.
Write the director's note.`;

    // Low temperature so the note stays close to the measured facts.
    const raw = await generateText(system, user, 0.3);
    const note = raw.trim().replace(/^["']+|["']+$/g, "").slice(0, 600);
    if (!note) {
      return NextResponse.json({ error: "Empty critique — please retry" }, { status: 502 });
    }
    return NextResponse.json({ note });
  } catch (error: unknown) {
    return NextResponse.json(...toClientError(error, "Critique failed"));
  }
}
