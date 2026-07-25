/**
 * Deterministic movement classifier. Given the measured ImageFeatures, score a
 * FIXED, closed set of design movements and return the best matches with
 * weights. Pure — same features always yield the same movements. This is the
 * authoritative, model-free source of style labels (and the arbiter watsonx is
 * snapped to when keys exist). Output is "closest match", never asserted fact.
 */
import type { ImageFeatures } from "./image-features";

export interface StyleWeight {
  name: string;
  weight: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** ~0 below t, ramps to 1 as x → 1. */
const hi = (x: number, t: number) => clamp01((x - t) / (1 - t || 1e-6));
/** ~0 above t, ramps to 1 as x → 0. */
const lo = (x: number, t: number) => clamp01((t - x) / (t || 1e-6));
/** 1 inside [a,b], linear falloff of width `f` outside. */
const mid = (x: number, a: number, b: number, f = 0.15) =>
  x < a ? clamp01(1 - (a - x) / f) : x > b ? clamp01(1 - (x - b) / f) : 1;

const wmean = (conds: Array<[number, number]>): number => {
  let s = 0;
  let w = 0;
  for (const [v, wt] of conds) {
    s += v * wt;
    w += wt;
  }
  return w ? s / w : 0;
};

const orthogonal = (f: ImageFeatures) =>
  f.orientation === "horizontal" || f.orientation === "vertical"
    ? 1
    : f.symLR > 0.85
      ? 0.6
      : 0;

const isPrimary = (h: string) => h === "red" || h === "blue" || h === "yellow";

// Each movement: a name + a pure scoring function over the features.
const MOVEMENTS: Array<{ name: string; score: (f: ImageFeatures) => number }> = [
  {
    name: "Swiss Modernism",
    score: (f) =>
      wmean([
        [hi(f.negativeSpace, 0.5), 2],
        [hi(f.flatness, 0.6), 1.5],
        [orthogonal(f), 1.5],
        [hi(f.contrast, 0.25), 1],
        [lo(f.meanChroma, 0.35), 1],
      ]),
  },
  {
    name: "Minimalism",
    score: (f) =>
      wmean([
        [hi(f.negativeSpace, 0.6), 2.5],
        [lo(f.edgeDensity, 0.06), 1.5],
        [lo(f.meanChroma, 0.25), 1],
        [mid(f.contrast, 0.05, 0.35), 0.5],
      ]),
  },
  {
    name: "Bauhaus",
    score: (f) =>
      wmean([
        [hi(f.flatness, 0.6), 1.5],
        [hi(f.meanChroma, 0.4), 1.5],
        [orthogonal(f), 1.5],
        [hi(f.contrast, 0.3), 1],
        [isPrimary(f.dominantHue) ? 1 : 0.3, 1],
      ]),
  },
  {
    name: "Pop Art",
    score: (f) =>
      wmean([
        [hi(f.meanChroma, 0.45), 2.5],
        [hi(f.contrast, 0.3), 1.5],
        [hi(f.flatness, 0.55), 1],
        [f.harmony === "complementary" || f.harmony === "polychrome" ? 1 : 0.4, 1],
      ]),
  },
  {
    name: "Brutalism",
    score: (f) =>
      wmean([
        [hi(f.contrast, 0.3), 2],
        [lo(f.meanLuminance, 0.4), 1.5],
        [lo(f.meanChroma, 0.25), 1.5],
        [hi(f.edgeDensity, 0.08), 1],
      ]),
  },
  {
    name: "Art Deco",
    score: (f) =>
      wmean([
        [hi(f.symLR, 0.85), 1.5],
        [hi(f.contrast, 0.3), 1],
        [f.dominantHue === "amber" || f.dominantHue === "yellow" || f.warmFrac > 0.7 ? 1 : 0.3, 1.5],
        [hi(f.flatness, 0.5), 1],
        [mid(f.edgeDensity, 0.04, 0.14), 1],
      ]),
  },
  {
    name: "Maximalism",
    score: (f) =>
      wmean([
        [f.harmony === "polychrome" ? 1 : 0.3, 2],
        [hi(f.meanChroma, 0.35), 1.5],
        [hi(f.edgeDensity, 0.1), 1.5],
        [lo(f.negativeSpace, 0.4), 1],
      ]),
  },
  {
    name: "Editorial Modern",
    score: (f) =>
      wmean([
        [mid(f.negativeSpace, 0.3, 0.6), 1.5],
        [mid(f.contrast, 0.15, 0.4), 1],
        [f.aspect !== "square" ? 1 : 0.5, 1],
        [mid(f.meanChroma, 0.1, 0.4), 1],
      ]),
  },
  {
    name: "Analog / Grain",
    score: (f) =>
      wmean([
        [lo(f.flatness, 0.35), 2],
        [lo(f.meanChroma, 0.3), 1],
        [mid(f.meanLuminance, 0.2, 0.6), 1],
      ]),
  },
  {
    name: "Flat Design",
    score: (f) =>
      wmean([
        [hi(f.flatness, 0.6), 2],
        [mid(f.meanChroma, 0.25, 0.6), 1.5],
        [lo(f.edgeDensity, 0.08), 1],
        [mid(f.contrast, 0.1, 0.35), 0.5],
      ]),
  },
  {
    name: "Tonal / Monochrome",
    score: (f) =>
      wmean([
        [lo(f.meanChroma, 0.1), 3],
        [f.harmony === "monochrome" ? 1 : 0.3, 1],
      ]),
  },
];

const FLOOR = 0.45; // scores below this aren't credible matches

/**
 * Top design-movement matches for the measured features, weights normalised to
 * sum to 1. Returns at most `max`. Falls back to "Eclectic" when nothing scores.
 */
export function classifyMovements(f: ImageFeatures, max = 3): StyleWeight[] {
  const scored = MOVEMENTS.map((m) => ({ name: m.name, s: m.score(f) }))
    .filter((m) => m.s >= FLOOR)
    // Deterministic tie-break: score desc, then name asc.
    .sort((a, b) => b.s - a.s || a.name.localeCompare(b.name))
    .slice(0, max);

  if (scored.length === 0) return [{ name: "Eclectic", weight: 1 }];

  const total = scored.reduce((sum, m) => sum + m.s, 0);
  return scored.map((m) => ({
    name: m.name,
    weight: Math.round((m.s / total) * 100) / 100,
  }));
}
