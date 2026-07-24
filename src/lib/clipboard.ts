/**
 * Copy via the async Clipboard API, falling back to a hidden textarea +
 * execCommand where `navigator.clipboard` does not exist (insecure origins —
 * e.g. a demo served over plain http on a LAN). Resolves false instead of
 * throwing so callers can decide whether to show "Copied!".
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or transient failure — try the legacy path.
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
