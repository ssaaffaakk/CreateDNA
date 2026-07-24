/**
 * Real color extraction. Vision models guess hex codes from their impression
 * of an image rather than sampling pixels, so their palettes drift (a teal
 * reads as "forest green"). We sample the actual pixels client-side and name
 * them from the true hue, then feed those exact colors into the DNA.
 */

export interface RawColor {
  hex: string;
  weight: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
}

/**
 * Dominant colors from raw RGBA pixel data (a canvas's ImageData.data).
 * Quantizes, then greedily merges nearby buckets so subtle gradients collapse
 * into one representative color. Weights are each color's share of the top set.
 */
export function extractDominantColors(
  data: Uint8ClampedArray,
  maxColors = 6
): RawColor[] {
  const counts = new Map<number, number>();
  const pxCount = Math.floor(data.length / 4);
  // Cap work at ~20k samples regardless of image size.
  const stride = Math.max(1, Math.floor(pxCount / 20000));

  for (let p = 0; p < pxCount; p += stride) {
    const i = p * 4;
    if (data[i + 3] < 128) continue; // skip transparent pixels
    const r = data[i] & 0xf8;
    const g = data[i + 1] & 0xf8;
    const b = data[i + 2] & 0xf8;
    const key = (r << 16) | (g << 8) | b;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const reps: { r: number; g: number; b: number; count: number }[] = [];
  const MERGE_DIST = 48;
  for (const [key, count] of sorted) {
    const r = (key >> 16) & 0xff;
    const g = (key >> 8) & 0xff;
    const b = key & 0xff;
    let merged = false;
    for (const rep of reps) {
      const dist = Math.sqrt(
        (rep.r - r) ** 2 + (rep.g - g) ** 2 + (rep.b - b) ** 2
      );
      if (dist < MERGE_DIST) {
        const t = rep.count + count;
        rep.r = Math.round((rep.r * rep.count + r * count) / t);
        rep.g = Math.round((rep.g * rep.count + g * count) / t);
        rep.b = Math.round((rep.b * rep.count + b * count) / t);
        rep.count = t;
        merged = true;
        break;
      }
    }
    if (!merged) reps.push({ r, g, b, count });
    if (reps.length >= 24) break; // plenty of candidates; the tail is noise
  }

  reps.sort((a, b) => b.count - a.count);
  const top = reps.slice(0, maxColors);
  const topTotal = top.reduce((sum, c) => sum + c.count, 0) || 1;

  return top.map((c) => ({
    hex: rgbToHex(c.r, c.g, c.b),
    weight: Math.round((c.count / topTotal) * 100) / 100,
  }));
}

/** A human color name derived from the true hex — so a teal reads "Teal". */
export function nameColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Color";
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  // Chroma (max-min), not HSL saturation: light tints have inflated HSL
  // saturation, so a cream reads as s≈0.5 while its chroma stays low.
  const chroma = (Math.max(...rgb) - Math.min(...rgb)) / 255;

  if (s < 0.1) {
    if (l < 0.15) return "Near Black";
    if (l < 0.35) return "Charcoal";
    if (l < 0.6) return "Gray";
    if (l < 0.85) return "Silver";
    return "White";
  }

  // Very light, low-chroma tones are cream/off-white in practice, not "Light
  // Amber/Orange" — warm hues read as cream, cool hues as off-white.
  if (l > 0.82 && chroma < 0.16) {
    return h >= 20 && h < 95 ? "Cream" : "Off White";
  }

  const hue =
    h < 15 || h >= 345
      ? "Red"
      : h < 40
        ? "Orange"
        : h < 65
          ? "Amber"
          : h < 80
            ? "Yellow"
            : h < 160
              ? "Green"
              : h < 190
                ? "Teal"
                : h < 250
                  ? "Blue"
                  : h < 285
                    ? "Purple"
                    : h < 330
                      ? "Magenta"
                      : "Pink";

  const prefix =
    l < 0.28 ? "Deep " : l > 0.78 ? "Light " : s < 0.4 ? "Muted " : "";
  return prefix + hue;
}
