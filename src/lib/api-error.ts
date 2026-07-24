/**
 * Upstream watsonx errors embed raw response bodies (and sometimes request
 * identifiers), so only surface messages the user can act on and keep the
 * rest server-side.
 */
export function toClientError(
  error: unknown,
  fallback: string
): [{ error: string }, { status: number }] {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Missing environment variable")) {
    console.error("[api]", message);
    return [
      { error: "Server is not configured for AI — missing credentials" },
      { status: 503 },
    ];
  }
  // A rejected key is a configuration problem, not a transient fault — a
  // generic "please retry" would send the operator in the wrong direction.
  if (message.includes("IAM token exchange failed")) {
    console.error("[api]", message);
    return [
      { error: "AI credentials were rejected — check the server's watsonx configuration" },
      { status: 503 },
    ];
  }
  if (message.includes("timed out")) {
    return [{ error: "The AI request timed out — please retry" }, { status: 504 }];
  }

  console.error("[api]", message);
  return [{ error: `${fallback} — please retry` }, { status: 502 }];
}
