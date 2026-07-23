import { NextRequest, NextResponse } from "next/server";

/**
 * App Router handlers have no default body limit, and `req.json()` buffers the
 * whole payload before any size check can run — a single large POST can grow
 * the process by hundreds of MB. Reject on the declared length first.
 */
export function tooLarge(
  req: NextRequest,
  maxBytes: number
): NextResponse | null {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return NextResponse.json(
      { error: "Request too large" },
      { status: 413 }
    );
  }
  return null;
}

/** Caps every string in a model-prompt payload so callers cannot smuggle an
 *  arbitrary system prompt through an uncapped field. */
export function clampStrings<T>(value: T, maxLen: number, depth = 0): T {
  if (depth > 6) return value;
  if (typeof value === "string") {
    return (value.length > maxLen ? value.slice(0, maxLen) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => clampStrings(v, maxLen, depth + 1)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = clampStrings(v, maxLen, depth + 1);
    }
    return out as T;
  }
  return value;
}
