import { describe, it, expect } from "vitest";
import { computeImageFeatures } from "./image-features";

const W = 128;
const H = 128;

function make(fill: (x: number, y: number) => [number, number, number]) {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = fill(x, y);
      const i = (y * W + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  return d;
}

const solid = (r: number, g: number, b: number) => make(() => [r, g, b]);

describe("computeImageFeatures — determinism", () => {
  it("same pixels → byte-identical features every run", () => {
    const d = make((x, y) => (x + y < W ? [233, 69, 96] : [26, 26, 46]));
    const a = computeImageFeatures(d, W, H);
    const b = computeImageFeatures(d.slice(), W, H);
    expect(a).toEqual(b);
  });
});

describe("computeImageFeatures — colour", () => {
  it("warm image reads warm, cool image reads cool", () => {
    const warm = computeImageFeatures(solid(230, 90, 40), W, H);
    const cool = computeImageFeatures(solid(40, 90, 230), W, H);
    expect(warm.warmFrac).toBeGreaterThan(0.9);
    expect(cool.warmFrac).toBeLessThan(0.1);
  });

  it("dark vs light key", () => {
    const dark = computeImageFeatures(solid(18, 18, 26), W, H);
    const light = computeImageFeatures(solid(245, 242, 232), W, H);
    expect(dark.meanLuminance).toBeLessThan(0.2);
    expect(light.meanLuminance).toBeGreaterThan(0.85);
    expect(light.brightFrac).toBeGreaterThan(0.9);
    expect(dark.darkFrac).toBeGreaterThan(0.9);
  });

  it("vivid vs muted chroma", () => {
    const vivid = computeImageFeatures(solid(230, 20, 20), W, H);
    const muted = computeImageFeatures(solid(150, 140, 130), W, H);
    expect(vivid.meanChroma).toBeGreaterThan(0.6);
    expect(muted.meanChroma).toBeLessThan(0.12);
  });

  it("complementary split is detected and balanced in temperature", () => {
    // left red (warm), right cyan (cool)
    const d = make((x) => (x < W / 2 ? [220, 40, 40] : [40, 220, 220]));
    const f = computeImageFeatures(d, W, H);
    expect(f.harmony).toBe("complementary");
    expect(f.warmFrac).toBeGreaterThan(0.4);
    expect(f.warmFrac).toBeLessThan(0.6);
  });

  it("single hue is monochrome", () => {
    expect(computeImageFeatures(solid(200, 60, 60), W, H).harmony).toBe("monochrome");
  });
});

describe("computeImageFeatures — composition + technique", () => {
  it("flat minimal (big ground + tiny mark) vs busy checkerboard", () => {
    const minimal = make((x, y) =>
      x > 52 && x < 76 && y > 52 && y < 76 ? [26, 26, 46] : [245, 242, 232]
    );
    const busy = make((x, y) => ((x >> 2) + (y >> 2)) % 2 ? [10, 10, 10] : [240, 60, 40]);
    const m = computeImageFeatures(minimal, W, H);
    const b = computeImageFeatures(busy, W, H);
    expect(m.edgeDensity).toBeLessThan(b.edgeDensity);
    expect(m.negativeSpace).toBeGreaterThan(0.8);
    expect(m.flatness).toBeGreaterThan(0.9);
    expect(b.edgeDensity).toBeGreaterThan(m.edgeDensity);
  });

  it("bilateral symmetry: symmetric vs asymmetric", () => {
    const symmetric = make((x) => (Math.abs(x - W / 2) < 20 ? [20, 20, 20] : [240, 240, 240]));
    const asymmetric = make((x) => (x < 30 ? [20, 20, 20] : [240, 240, 240]));
    const s = computeImageFeatures(symmetric, W, H);
    const a = computeImageFeatures(asymmetric, W, H);
    expect(s.symLR).toBeGreaterThan(0.95);
    expect(a.symLR).toBeLessThan(s.symLR);
  });

  it("aspect ratio from source dimensions", () => {
    const d = solid(120, 120, 120);
    expect(computeImageFeatures(d, W, H, 16 / 9).aspect).toBe("landscape");
    expect(computeImageFeatures(d, W, H, 3 / 4).aspect).toBe("portrait");
    expect(computeImageFeatures(d, W, H, 1).aspect).toBe("square");
  });
});
