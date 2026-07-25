/**
 * Deterministic image features. A pure function of the raw RGBA pixels — the
 * SAME pixels always yield the SAME numbers, so the "reading" (mood, technique,
 * composition, colour story) is measured from the image, never guessed by a
 * model. Runs on the canvas ImageData the uploader already holds.
 */

export type Harmony =
  | "monochrome"
  | "analogous"
  | "complementary"
  | "triadic"
  | "polychrome";

export type Orientation = "horizontal" | "vertical" | "diagonal" | "mixed";
export type Aspect = "landscape" | "portrait" | "square";

export interface ImageFeatures {
  warmFrac: number; // 0..1 warm share among chromatic pixels
  meanChroma: number; // 0..1
  chromaVar: number; // variance of chroma
  meanLuminance: number; // 0..1
  darkFrac: number; // share of very dark pixels
  brightFrac: number; // share of very bright pixels
  contrast: number; // stdev of luminance, 0..1
  symLR: number; // 0..1 left-right bilateral symmetry
  symTB: number; // 0..1 top-bottom
  negativeSpace: number; // 0..1 share of pixels near the ground colour
  edgeDensity: number; // 0..1 share of strong-gradient cells
  orientation: Orientation;
  harmony: Harmony;
  dominantHue: string; // hue family name, or "neutral"
  flatness: number; // 0..1 coverage of the 8 largest colour buckets
  aspect: Aspect;
  hueHistogram: number[]; // 12 chroma-weighted bins (normalised)
}

const NEAR_NEUTRAL = 0.1; // chroma below this = treat as grey for hue/temperature

function hueOf(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return -1;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

function hueFamily(h: number): string {
  if (h < 0) return "neutral";
  if (h < 15 || h >= 345) return "red";
  if (h < 40) return "orange";
  if (h < 65) return "amber";
  if (h < 80) return "yellow";
  if (h < 160) return "green";
  if (h < 190) return "teal";
  if (h < 250) return "blue";
  if (h < 285) return "purple";
  if (h < 330) return "magenta";
  return "pink";
}

// Nearest-neighbour downsample of luminance (0..1) to a size×size grid.
function lumaGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  size: number
): Float64Array {
  const grid = new Float64Array(size * size);
  for (let gy = 0; gy < size; gy++) {
    const sy = Math.min(height - 1, Math.floor((gy / size) * height));
    for (let gx = 0; gx < size; gx++) {
      const sx = Math.min(width - 1, Math.floor((gx / size) * width));
      const i = (sy * width + sx) * 4;
      grid[gy * size + gx] =
        (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    }
  }
  return grid;
}

function detectHarmony(hist: number[]): Harmony {
  const total = hist.reduce((s, v) => s + v, 0);
  if (total <= 0) return "monochrome";
  const norm = hist.map((v) => v / total);
  // Cluster adjacent significant bins (circular).
  const active = norm.map((v) => v > 0.12);
  if (!active.some(Boolean)) return "monochrome";
  const clusters: number[] = []; // center bin of each cluster
  const seen = new Array(12).fill(false);
  for (let i = 0; i < 12; i++) {
    if (!active[i] || seen[i]) continue;
    const members: number[] = [];
    let j = i;
    while (active[j % 12] && !seen[j % 12] && members.length < 12) {
      seen[j % 12] = true;
      members.push(j % 12);
      j++;
    }
    clusters.push(members[Math.floor(members.length / 2)]);
  }
  if (clusters.length <= 1) {
    const width = active.filter(Boolean).length;
    return width <= 1 ? "monochrome" : "analogous";
  }
  if (clusters.length === 2) {
    let gap = Math.abs(clusters[0] - clusters[1]);
    gap = Math.min(gap, 12 - gap); // circular
    return gap >= 5 ? "complementary" : "analogous";
  }
  if (clusters.length === 3) return "triadic";
  return "polychrome";
}

function detectOrientation(
  grid: Float64Array,
  size: number
): { edgeDensity: number; orientation: Orientation } {
  let strong = 0;
  let h = 0;
  let v = 0;
  let diag = 0;
  const cells = (size - 2) * (size - 2);
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const gx =
        grid[(y - 1) * size + x + 1] +
        2 * grid[y * size + x + 1] +
        grid[(y + 1) * size + x + 1] -
        grid[(y - 1) * size + x - 1] -
        2 * grid[y * size + x - 1] -
        grid[(y + 1) * size + x - 1];
      const gy =
        grid[(y + 1) * size + x - 1] +
        2 * grid[(y + 1) * size + x] +
        grid[(y + 1) * size + x + 1] -
        grid[(y - 1) * size + x - 1] -
        2 * grid[(y - 1) * size + x] -
        grid[(y - 1) * size + x + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag > 0.6) {
        strong++;
        // Edge direction is perpendicular to the gradient.
        let ang = (Math.atan2(gy, gx) * 180) / Math.PI + 90;
        ang = ((ang % 180) + 180) % 180;
        if (ang < 22.5 || ang >= 157.5) h++;
        else if (ang >= 67.5 && ang < 112.5) v++;
        else diag++;
      }
    }
  }
  const edgeDensity = cells > 0 ? strong / cells : 0;
  let orientation: Orientation = "mixed";
  const top = Math.max(h, v, diag);
  const others = h + v + diag - top; // the other two directions combined
  // A direction wins only if it clearly beats the average of the other two.
  if (top >= 4 && top > 1.4 * (others / 2)) {
    orientation = top === h ? "horizontal" : top === v ? "vertical" : "diagonal";
  }
  return { edgeDensity, orientation };
}

export function computeImageFeatures(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  srcAspect?: number
): ImageFeatures {
  const pxCount = Math.floor(data.length / 4);
  const stride = Math.max(1, Math.floor(pxCount / 20000));

  let warm = 0;
  let cool = 0;
  let chromaSum = 0;
  let chromaSqSum = 0;
  let chromaCount = 0;
  let lumSum = 0;
  let lumSqSum = 0;
  let dark = 0;
  let bright = 0;
  let n = 0;
  const hueHist = new Array(12).fill(0);
  const buckets = new Map<number, number>();

  for (let p = 0; p < pxCount; p += stride) {
    const i = p * 4;
    if (data[i + 3] < 128) continue; // skip transparent
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    n++;

    const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lumSum += y;
    lumSqSum += y * y;
    if (y < 0.25) dark++;
    if (y > 0.75) bright++;

    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    if (chroma > NEAR_NEUTRAL) {
      chromaSum += chroma;
      chromaSqSum += chroma * chroma;
      chromaCount++;
      const h = hueOf(r, g, b);
      if (h >= 0) {
        if (h < 90 || h >= 300) warm++;
        else cool++;
        hueHist[Math.min(11, Math.floor(h / 30))] += chroma;
      }
    }

    const key = ((r & 0xf8) << 16) | ((g & 0xf8) << 8) | (b & 0xf8);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  if (n === 0) {
    return {
      warmFrac: 0, meanChroma: 0, chromaVar: 0, meanLuminance: 0,
      darkFrac: 0, brightFrac: 0, contrast: 0, symLR: 1, symTB: 1,
      negativeSpace: 1, edgeDensity: 0, orientation: "mixed",
      harmony: "monochrome", dominantHue: "neutral", flatness: 1,
      aspect: "square", hueHistogram: new Array(12).fill(0),
    };
  }

  const meanLuminance = lumSum / n;
  const contrast = Math.sqrt(Math.max(0, lumSqSum / n - meanLuminance ** 2));
  const meanChroma = chromaCount ? chromaSum / chromaCount : 0;
  const chromaVar = chromaCount
    ? Math.max(0, chromaSqSum / chromaCount - meanChroma ** 2)
    : 0;
  const warmFrac = warm + cool ? warm / (warm + cool) : 0.5;

  const histTotal = hueHist.reduce((s, v) => s + v, 0);
  const hueHistogram = histTotal
    ? hueHist.map((v) => Math.round((v / histTotal) * 1000) / 1000)
    : hueHist;
  const harmony = detectHarmony(hueHist);
  const peakBin = hueHist.indexOf(Math.max(...hueHist));
  const dominantHue =
    histTotal > 0 && chromaCount / n > 0.05
      ? hueFamily(peakBin * 30 + 15)
      : "neutral";

  // Flatness: coverage of the 8 largest colour buckets.
  const counts = [...buckets.values()].sort((a, b) => b - a);
  const top8 = counts.slice(0, 8).reduce((s, v) => s + v, 0);
  const flatness = n ? top8 / n : 1;

  // Negative space: share of pixels near the single most common bucket colour.
  let groundKey = 0;
  let groundMax = 0;
  for (const [k, c] of buckets) if (c > groundMax) { groundMax = c; groundKey = k; }
  const gr = (groundKey >> 16) & 0xff;
  const gg = (groundKey >> 8) & 0xff;
  const gb = groundKey & 0xff;
  let near = 0;
  for (let p = 0; p < pxCount; p += stride) {
    const i = p * 4;
    if (data[i + 3] < 128) continue;
    const dr = data[i] - gr;
    const dg = data[i + 1] - gg;
    const db = data[i + 2] - gb;
    if (dr * dr + dg * dg + db * db < 40 * 40) near++;
  }
  const negativeSpace = n ? near / n : 1;

  // Symmetry on a 64x64 luma grid.
  const sg = lumaGrid(data, width, height, 64);
  let diffLR = 0;
  let diffTB = 0;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 32; x++) {
      diffLR += Math.abs(sg[y * 64 + x] - sg[y * 64 + (63 - x)]);
    }
  }
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      diffTB += Math.abs(sg[y * 64 + x] - sg[(63 - y) * 64 + x]);
    }
  }
  const symLR = 1 - diffLR / (64 * 32);
  const symTB = 1 - diffTB / (64 * 32);

  // Edges + orientation on a 128x128 luma grid.
  const eg = lumaGrid(data, width, height, 128);
  const { edgeDensity, orientation } = detectOrientation(eg, 128);

  const ratio = srcAspect ?? width / height;
  const aspect: Aspect = ratio > 1.2 ? "landscape" : ratio < 0.83 ? "portrait" : "square";

  const round = (x: number) => Math.round(x * 1000) / 1000;
  return {
    warmFrac: round(warmFrac),
    meanChroma: round(meanChroma),
    chromaVar: round(chromaVar),
    meanLuminance: round(meanLuminance),
    darkFrac: round(dark / n),
    brightFrac: round(bright / n),
    contrast: round(contrast),
    symLR: round(symLR),
    symTB: round(symTB),
    negativeSpace: round(negativeSpace),
    edgeDensity: round(edgeDensity),
    orientation,
    harmony,
    dominantHue,
    flatness: round(flatness),
    aspect,
    hueHistogram,
  };
}
