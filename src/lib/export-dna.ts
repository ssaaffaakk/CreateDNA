import type { StyleDNA } from "./style-dna";

export type ExportFormat = "json" | "markdown" | "system-prompt";

/**
 * Fetches a formatted export of the DNA from /api/export and triggers a file
 * download. Throws on failure so each caller can surface the error next to its
 * own button. Shared by StyleDNAPanel (export straight after a scan) and
 * OutputPanel (export alongside a generated kit).
 */
export async function downloadDNAExport(
  styleDNA: StyleDNA,
  format: ExportFormat
): Promise<void> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ styleDNA, format }),
  });

  const data = await res.json();
  // Without this, a failed export downloads a file whose entire contents are
  // the literal text "undefined".
  if (!res.ok || data.export === undefined) {
    throw new Error(data.error || "Export failed");
  }

  const content =
    typeof data.export === "string"
      ? data.export
      : JSON.stringify(data.export, null, 2);

  const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `creative-dna.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
