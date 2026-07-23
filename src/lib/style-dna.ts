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

export function mergeStyleDNA(
  existing: StyleDNA | null,
  newAnalysis: Omit<StyleDNA, "id" | "createdAt" | "updatedAt" | "imageCount" | "consistencyScore">
): StyleDNA {
  if (!existing) {
    const styles = newAnalysis.styles;
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 1,
      consistencyScore: 100,
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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
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
  for (const s of [...old, ...incoming]) {
    normalized.set(s.toLowerCase(), s);
  }
  return [...normalized.values()].slice(0, 10);
}

function calculateConsistency(styles: StyleWeight[]): number {
  if (styles.length <= 1) return 100;
  const total = styles.reduce((s, v) => s + v.weight, 0);
  if (total === 0) return 0;
  const normalized = styles.map((s) => s.weight / total);
  const entropy = -normalized.reduce((sum, p) => (p > 0 ? sum + p * Math.log2(p) : sum), 0);
  const maxEntropy = Math.log2(styles.length);
  const consistency = Math.round((1 - entropy / maxEntropy) * 100);
  return Math.max(0, Math.min(100, consistency));
}
