/**
 * Maps the measured ImageFeatures to human-readable mood / technique /
 * composition descriptors through FIXED bands. Pure and deterministic: the
 * numbers come from pixels, and the same numbers always produce the same
 * words — this is what replaces the vision model's guessed mood/technique.
 */
import type { Harmony, ImageFeatures } from "./image-features";

export interface Descriptors {
  temperature: "warm" | "cool" | "balanced";
  harmony: Harmony;
  dominantHue: string;
  mood: string[];
  technique: string[];
  composition: string[];
}

const cap = (arr: string[], n: number): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
    if (out.length >= n) break;
  }
  return out;
};

export function featuresToDescriptors(f: ImageFeatures): Descriptors {
  const temperature =
    f.warmFrac > 0.65 ? "warm" : f.warmFrac < 0.35 ? "cool" : "balanced";

  // ---- Mood (ranked most-salient first) ----
  const mood: string[] = [];
  if (f.contrast > 0.3) mood.push("bold", "dramatic");
  if (f.meanLuminance < 0.3) mood.push("moody");
  else if (f.meanLuminance > 0.78) mood.push("light", "airy");
  if (f.meanChroma > 0.35) mood.push("vibrant", "energetic");
  else if (f.meanChroma < 0.12) mood.push("restrained", "sophisticated");
  if (f.negativeSpace > 0.6) mood.push("calm", "serene");
  if (temperature === "warm") mood.push("inviting");
  else if (temperature === "cool") mood.push("cool");
  if (f.contrast < 0.12) mood.push("soft", "gentle");
  if (mood.length === 0) mood.push("balanced");

  // ---- Technique ----
  const technique: string[] = [];
  if (f.flatness > 0.6) technique.push("flat colour", "limited palette");
  else if (f.flatness < 0.3) technique.push("photographic");
  if (f.contrast > 0.32) technique.push("high contrast");
  if (f.darkFrac > 0.3 && f.brightFrac > 0.3) technique.push("chiaroscuro");
  if (f.negativeSpace > 0.55) technique.push("negative space");
  if (f.meanChroma < 0.12) technique.push("muted palette");
  else if (f.meanChroma > 0.35) technique.push("high-saturation colour");
  if (technique.length === 0) technique.push("balanced palette");

  // ---- Composition ----
  const composition: string[] = [];
  if (f.symLR > 0.9) composition.push("symmetric", "centred");
  else if (f.symLR < 0.75) composition.push("asymmetric", "dynamic");
  if (f.negativeSpace > 0.55) composition.push("strong negative space", "minimal");
  else if (f.edgeDensity > 0.1) composition.push("dense", "detailed");
  if (f.orientation === "horizontal") composition.push("horizontal");
  else if (f.orientation === "vertical") composition.push("vertical emphasis");
  else if (f.orientation === "diagonal") composition.push("diagonal");
  if (f.aspect === "landscape") composition.push("landscape");
  else if (f.aspect === "portrait") composition.push("portrait");
  if (composition.length === 0) composition.push("balanced layout");

  return {
    temperature,
    harmony: f.harmony,
    dominantHue: f.dominantHue,
    mood: cap(mood, 5),
    technique: cap(technique, 5),
    composition: cap(composition, 5),
  };
}
