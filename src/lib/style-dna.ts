export interface StyleDNA {
  id: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  palette: ColorEntry[];
  composition: string[];
  styles: StyleWeight[];
  mood: string[];
  techniques: string[];
  influences: string[];
  summary: string;
  consistencyScore: number;
}

export interface ColorEntry {
  hex: string;
  name: string;
  weight: number;
}

export interface StyleWeight {
  name: string;
  weight: number;
}

export const ANALYSIS_PROMPT = `You are a professional design critic analyzing a creative work. You must respond ONLY with valid JSON — no markdown fences, no explanation, no text before or after the JSON.

Analyze this image and extract the creator's style DNA as JSON:

{
  "palette": [
    {"hex": "#hexcode", "name": "color name", "weight": 0.0 to 1.0}
  ],
  "composition": ["list composition traits: asymmetric, grid-based, centered, diagonal, layered, rule-of-thirds, radial, etc."],
  "styles": [
    {"name": "art/design movement", "weight": 0.0 to 1.0}
  ],
  "mood": ["emotional keywords: bold, serene, playful, dramatic, minimal, chaotic, etc."],
  "techniques": ["visual techniques: flat color, gradient, texture overlay, negative space, drop shadow, grain, halftone, line art, etc."],
  "influences": ["specific designers, artists, or movements this work echoes"],
  "summary": "A concise paragraph describing this creator's visual identity based on this piece"
}

Rules:
- Extract 3-6 dominant colors with actual hex codes sampled from the image
- Style weights must sum to approximately 1.0
- Be SPECIFIC — not "colorful" but "high-saturation complementary palette with warm dominance"
- Not "modern" but "Swiss-influenced minimalism with geometric sans-serif typography"
- Respond with ONLY the JSON object, nothing else`;

export type StyleAnalysis = Omit<
  StyleDNA,
  "id" | "createdAt" | "updatedAt" | "imageCount" | "consistencyScore"
>;

// The vision model can return a partial or mistyped object (a refusal, a missing
// array, or `"mood": "serene"` instead of a list). Without this, a bad response
// either throws inside the merge helpers or persists a DNA with undefined arrays
// that crashes the panel on every reload.
function sanitizeAnalysis(a: Partial<StyleAnalysis> | null | undefined): StyleAnalysis {
  const strArr = (x: unknown): string[] =>
    Array.isArray(x)
      ? x.filter((s): s is string => typeof s === "string" && s.length > 0)
      : typeof x === "string" && x
        ? [x]
        : [];

  const src = a ?? {};

  // The model can list the same colour twice. Duplicate hexes render as two
  // identical swatches and collide on React's `key={color.hex}`, so keep only
  // the first (most-dominant) occurrence of each.
  const dedupePalette = (list: ColorEntry[]): ColorEntry[] => {
    const seen = new Set<string>();
    return list.filter((c) => {
      const key = c.hex.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    palette: dedupePalette(
      (Array.isArray(src.palette) ? src.palette : []).filter(
        (c): c is ColorEntry =>
          typeof c?.hex === "string" &&
          typeof c?.name === "string" &&
          Number.isFinite(c?.weight)
      )
    ),
    styles: (Array.isArray(src.styles) ? src.styles : []).filter(
      (s) => typeof s?.name === "string" && Number.isFinite(s?.weight)
    ),
    composition: strArr(src.composition),
    mood: strArr(src.mood),
    techniques: strArr(src.techniques),
    influences: strArr(src.influences),
    summary: typeof src.summary === "string" ? src.summary : "",
  };
}

export function mergeStyleDNA(
  existing: StyleDNA | null,
  rawAnalysis: Partial<StyleAnalysis>
): StyleDNA {
  const newAnalysis = sanitizeAnalysis(rawAnalysis);

  if (!existing) {
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 1,
      consistencyScore: calculateConsistency(newAnalysis.styles),
      ...newAnalysis,
    };
  }

  const totalImages = existing.imageCount + 1;
  const oldWeight = existing.imageCount / totalImages;
  const newWeight = 1 / totalImages;

  const mergedStyles = mergeWeighted(existing.styles, newAnalysis.styles, oldWeight, newWeight);

  return {
    ...existing,
    updatedAt: new Date().toISOString(),
    imageCount: totalImages,
    palette: mergePalettes(existing.palette, newAnalysis.palette, oldWeight, newWeight),
    composition: mergeUnique(existing.composition, newAnalysis.composition),
    styles: mergedStyles,
    mood: mergeUnique(existing.mood, newAnalysis.mood),
    techniques: mergeUnique(existing.techniques, newAnalysis.techniques),
    influences: mergeUnique(existing.influences, newAnalysis.influences),
    summary: newAnalysis.summary,
    consistencyScore: calculateConsistency(mergedStyles),
  };
}

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.replace("#", "").trim().toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  // Unparseable hex stays a distinct entry instead of producing NaN comparisons.
  if (!ra || !rb) return Infinity;
  const [r1, g1, b1] = ra;
  const [r2, g2, b2] = rb;
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function mergePalettes(
  old: ColorEntry[],
  incoming: ColorEntry[],
  oldW: number,
  newW: number
): ColorEntry[] {
  const result: ColorEntry[] = old.map((c) => ({ ...c, weight: c.weight * oldW }));

  for (const c of incoming) {
    const closest = result.reduce<{ index: number; dist: number }>(
      (best, existing, i) => {
        const d = colorDistance(c.hex, existing.hex);
        return d < best.dist ? { index: i, dist: d } : best;
      },
      { index: -1, dist: Infinity }
    );

    if (closest.dist < 50) {
      result[closest.index].weight += c.weight * newW;
    } else {
      result.push({ ...c, weight: c.weight * newW });
    }
  }

  return result
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);
}

function mergeWeighted(
  old: StyleWeight[],
  incoming: StyleWeight[],
  oldW: number,
  newW: number
): StyleWeight[] {
  const map = new Map<string, number>();
  for (const s of old) map.set(s.name.toLowerCase(), (map.get(s.name.toLowerCase()) || 0) + s.weight * oldW);
  for (const s of incoming) map.set(s.name.toLowerCase(), (map.get(s.name.toLowerCase()) || 0) + s.weight * newW);
  return [...map.entries()]
    .map(([name, weight]) => ({ name, weight: Math.round(weight * 100) / 100 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);
}

function mergeUnique(old: string[], incoming: string[]): string[] {
  const normalized = new Map<string, string>();
  // Newest tags first so they survive the cap — otherwise the profile freezes
  // at the first ten tags and later uploads never show up.
  for (const s of [...incoming, ...old]) {
    const key = s.toLowerCase();
    if (!normalized.has(key)) normalized.set(key, s);
  }
  return [...normalized.values()].slice(0, 10);
}

export function calculateConsistency(styles: StyleWeight[]): number {
  if (styles.length <= 1) return 100;
  const total = styles.reduce((s, v) => s + v.weight, 0);
  if (total === 0) return 0;
  const normalized = styles.map((s) => s.weight / total);
  const entropy = -normalized.reduce((sum, p) => (p > 0 ? sum + p * Math.log2(p) : sum), 0);
  const maxEntropy = Math.log2(styles.length);
  const consistency = Math.round((1 - entropy / maxEntropy) * 100);
  return Math.max(0, Math.min(100, consistency));
}
