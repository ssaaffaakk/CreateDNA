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

export const ANALYSIS_PROMPT = `You are a design expert analyzing a creative work. Respond ONLY with valid JSON, no markdown, no explanation.

Analyze this image and extract the creator's style DNA:

{
  "palette": [
    {"hex": "#hexcode", "name": "color name", "weight": 0.0-1.0}
  ],
  "composition": ["list of composition traits, e.g. asymmetric, grid-based, centered, diagonal, layered"],
  "styles": [
    {"name": "style movement name", "weight": 0.0-1.0}
  ],
  "mood": ["list of mood/emotion keywords"],
  "techniques": ["list of visual techniques used"],
  "influences": ["list of designers/artists/movements this reminds you of"],
  "summary": "One paragraph describing this creator's visual identity"
}

Be specific and detailed. Use actual hex codes from the image. Weight values should sum roughly to 1.0 for styles.`;

export function mergeStyleDNA(
  existing: StyleDNA | null,
  newAnalysis: Omit<StyleDNA, "id" | "createdAt" | "updatedAt" | "imageCount">
): StyleDNA {
  if (!existing) {
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 1,
      ...newAnalysis,
    };
  }

  const totalImages = existing.imageCount + 1;
  const oldWeight = existing.imageCount / totalImages;
  const newWeight = 1 / totalImages;

  return {
    ...existing,
    updatedAt: new Date().toISOString(),
    imageCount: totalImages,
    palette: mergePalettes(existing.palette, newAnalysis.palette, oldWeight, newWeight),
    composition: mergeUnique(existing.composition, newAnalysis.composition),
    styles: mergeWeighted(existing.styles, newAnalysis.styles, oldWeight, newWeight),
    mood: mergeUnique(existing.mood, newAnalysis.mood),
    techniques: mergeUnique(existing.techniques, newAnalysis.techniques),
    influences: mergeUnique(existing.influences, newAnalysis.influences),
    summary: newAnalysis.summary,
  };
}

function mergePalettes(
  old: ColorEntry[],
  incoming: ColorEntry[],
  oldW: number,
  newW: number
): ColorEntry[] {
  const map = new Map<string, ColorEntry>();
  for (const c of old) {
    map.set(c.hex, { ...c, weight: c.weight * oldW });
  }
  for (const c of incoming) {
    const existing = map.get(c.hex);
    if (existing) {
      existing.weight += c.weight * newW;
    } else {
      map.set(c.hex, { ...c, weight: c.weight * newW });
    }
  }
  return [...map.values()]
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
  for (const s of old) map.set(s.name, (map.get(s.name) || 0) + s.weight * oldW);
  for (const s of incoming) map.set(s.name, (map.get(s.name) || 0) + s.weight * newW);
  return [...map.entries()]
    .map(([name, weight]) => ({ name, weight: Math.round(weight * 100) / 100 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);
}

function mergeUnique(old: string[], incoming: string[]): string[] {
  return [...new Set([...old, ...incoming])].slice(0, 10);
}
