import { describe, it, expect } from "vitest";
import { averageSignatures, onBrandScore, toSignature, verdict, type FeatureSignature } from "./on-brand";
import { computeImageFeatures } from "./image-features";

const sig = (over: Partial<FeatureSignature> = {}): FeatureSignature => ({
  warmFrac: 0.5, meanChroma: 0.4, meanLuminance: 0.5, contrast: 0.3,
  edgeDensity: 0.1, negativeSpace: 0.4, symLR: 0.8, flatness: 0.6, ...over,
});

describe("averageSignatures", () => {
  it("is the per-dimension mean", () => {
    const a = averageSignatures([sig({ warmFrac: 0.2 }), sig({ warmFrac: 0.8 })]);
    expect(a!.warmFrac).toBeCloseTo(0.5, 3);
  });
  it("returns null for no pieces", () => {
    expect(averageSignatures([])).toBeNull();
  });
});

describe("onBrandScore", () => {
  it("identical signature scores ~100", () => {
    const s = sig();
    expect(onBrandScore(s, s).score).toBe(100);
  });

  it("a very different image scores low with reasons", () => {
    const brand = sig({ warmFrac: 0.9, meanChroma: 0.15, negativeSpace: 0.7, edgeDensity: 0.03 });
    const offImg = sig({ warmFrac: 0.1, meanChroma: 0.7, negativeSpace: 0.1, edgeDensity: 0.4 });
    const r = onBrandScore(brand, offImg);
    expect(r.score).toBeLessThan(50);
    expect(r.reasons.length).toBeGreaterThan(0);
    // cooler + more saturated + busier than the warm/muted/minimal brand
    expect(r.reasons.some((x) => /cooler/.test(x))).toBe(true);
    expect(r.reasons.some((x) => /saturated/.test(x))).toBe(true);
  });

  it("a close image scores high", () => {
    const brand = sig();
    const close = sig({ warmFrac: 0.53, meanChroma: 0.42, contrast: 0.28 });
    expect(onBrandScore(brand, close).score).toBeGreaterThan(80);
  });

  it("is deterministic", () => {
    const a = onBrandScore(sig(), sig({ contrast: 0.6 }));
    const b = onBrandScore(sig(), sig({ contrast: 0.6 }));
    expect(a).toEqual(b);
  });
});

describe("verdict bands", () => {
  it("maps score to a label", () => {
    expect(verdict(95)).toBe("On brand");
    expect(verdict(70)).toBe("Mostly on brand");
    expect(verdict(45)).toBe("Drifting off brand");
    expect(verdict(20)).toBe("Off brand");
  });
});

describe("end to end from pixels", () => {
  it("an image matching the brand scores higher than one that doesn't", () => {
    const W = 96, H = 96;
    const paint = (fill: (x: number, y: number) => [number, number, number]) => {
      const d = new Uint8ClampedArray(W * H * 4);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const [r, g, b] = fill(x, y); const i = (y * W + x) * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
      return d;
    };
    // Brand = warm, muted, minimal (cream ground + small warm mark)
    const brandImg = paint((x, y) => (x > 40 && x < 56 && y > 40 && y < 56 ? [200, 120, 60] : [244, 238, 224]));
    const brandSig = toSignature(computeImageFeatures(brandImg, W, H));
    // On-brand candidate: same recipe, mark moved slightly
    const onImg = paint((x, y) => (x > 44 && x < 60 && y > 44 && y < 60 ? [205, 125, 62] : [244, 238, 224]));
    // Off-brand candidate: cool, saturated, busy
    const offImg = paint((x, y) => (((x >> 2) + (y >> 2)) % 2 ? [20, 40, 220] : [20, 210, 220]));
    const on = onBrandScore(brandSig, toSignature(computeImageFeatures(onImg, W, H)));
    const off = onBrandScore(brandSig, toSignature(computeImageFeatures(offImg, W, H)));
    expect(on.score).toBeGreaterThan(off.score);
    expect(on.score).toBeGreaterThan(75);
    expect(off.score).toBeLessThan(55);
  });
});
