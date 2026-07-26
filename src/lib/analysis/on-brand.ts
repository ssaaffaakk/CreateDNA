/**
 * On-brand scoring. Compares one image's deterministic signature against a
 * creator's DNA signature and returns a reproducible 0–100 "how on-brand"
 * score plus human reasons. Pure — the same inputs always give the same score.
 */
import type { ImageFeatures } from "./image-features";

/** The numeric slice of the features used for brand comparison (all 0..1). */
export interface FeatureSignature {
  warmFrac: number;
  meanChroma: number;
  meanLuminance: number;
  contrast: number;
  edgeDensity: number;
  negativeSpace: number;
  symLR: number;
  flatness: number;
}

const KEYS: (keyof FeatureSignature)[] = [
  "warmFrac",
  "meanChroma",
  "meanLuminance",
  "contrast",
  "edgeDensity",
  "negativeSpace",
  "symLR",
  "flatness",
];

// How much each dimension moves the score, and the words for each direction.
const DIMS: Record<
  keyof FeatureSignature,
  { weight: number; more: string; less: string }
> = {
  warmFrac: { weight: 1.2, more: "warmer than your palette", less: "cooler than your palette" },
  meanChroma: { weight: 1.2, more: "more saturated than your work", less: "more muted than your work" },
  meanLuminance: { weight: 1, more: "lighter than your work", less: "darker than your work" },
  contrast: { weight: 1, more: "higher contrast than your style", less: "flatter contrast than your style" },
  edgeDensity: { weight: 1.1, more: "busier than your compositions", less: "sparser than your compositions" },
  negativeSpace: { weight: 1.1, more: "more negative space than usual", less: "less negative space than usual" },
  symLR: { weight: 0.7, more: "more symmetric than your work", less: "more asymmetric than your work" },
  flatness: { weight: 0.9, more: "flatter than your work", less: "more photographic than your work" },
};

export function toSignature(f: ImageFeatures): FeatureSignature {
  return {
    warmFrac: f.warmFrac,
    meanChroma: f.meanChroma,
    meanLuminance: f.meanLuminance,
    contrast: f.contrast,
    edgeDensity: f.edgeDensity,
    negativeSpace: f.negativeSpace,
    symLR: f.symLR,
    flatness: f.flatness,
  };
}

/** Mean signature across a creator's pieces — the brand "centroid". */
export function averageSignatures(sigs: FeatureSignature[]): FeatureSignature | null {
  if (sigs.length === 0) return null;
  const out = {} as FeatureSignature;
  for (const k of KEYS) {
    out[k] = Math.round((sigs.reduce((s, v) => s + v[k], 0) / sigs.length) * 1000) / 1000;
  }
  return out;
}

export interface OnBrandResult {
  score: number; // 0..100
  reasons: string[]; // biggest deviations, human-readable
  matches: string[]; // dimensions that fit well
}

/**
 * Score how on-brand an image is versus the DNA signature. Deterministic:
 * a weighted RMS distance over the 0..1 dimensions, spread so a moderate drift
 * is clearly penalised, plus the largest deviations named as reasons.
 */
export function onBrandScore(
  dna: FeatureSignature,
  img: FeatureSignature
): OnBrandResult {
  let wSum = 0;
  let dSum = 0;
  const diffs: { key: keyof FeatureSignature; delta: number }[] = [];
  for (const k of KEYS) {
    const delta = img[k] - dna[k];
    const w = DIMS[k].weight;
    dSum += w * delta * delta;
    wSum += w;
    diffs.push({ key: k, delta });
  }
  const rms = Math.sqrt(dSum / wSum); // 0..1
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - Math.min(1, rms * 1.7)))));

  const sorted = [...diffs].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const reasons = sorted
    .filter((d) => Math.abs(d.delta) > 0.14)
    .slice(0, 3)
    .map((d) => (d.delta > 0 ? DIMS[d.key].more : DIMS[d.key].less));
  const matches = sorted
    .filter((d) => Math.abs(d.delta) <= 0.08)
    .slice(0, 3)
    .map((d) => {
      const label = d.key
        .replace(/([A-Z])/g, " $1")
        .replace("warm Frac", "colour temperature")
        .replace("mean Chroma", "saturation")
        .replace("mean Luminance", "brightness")
        .replace("edge Density", "detail level")
        .replace("negative Space", "negative space")
        .replace("sym L R", "symmetry")
        .toLowerCase()
        .trim();
      return label;
    });

  return { score, reasons, matches };
}

export function verdict(score: number): string {
  if (score >= 80) return "On brand";
  if (score >= 60) return "Mostly on brand";
  if (score >= 40) return "Drifting off brand";
  return "Off brand";
}
