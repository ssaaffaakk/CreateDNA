import { describe, it, expect } from "vitest";
import { mergeStyleDNA, calculateConsistency } from "./style-dna";
import type { StyleAnalysis } from "./style-dna";

const analysis = (over: Partial<StyleAnalysis> = {}): StyleAnalysis => ({
  palette: [{ hex: "#1a1a2e", name: "Deep Navy", weight: 0.6 }],
  styles: [{ name: "swiss modernism", weight: 1 }],
  composition: ["asymmetric"],
  mood: ["bold"],
  techniques: ["flat colour"],
  influences: ["Vignelli"],
  summary: "test",
  ...over,
});

describe("calculateConsistency", () => {
  it("a strongly dominant style is highly consistent", () => {
    expect(
      calculateConsistency([
        { name: "a", weight: 0.95 },
        { name: "b", weight: 0.05 },
      ])
    ).toBeGreaterThan(60);
  });

  it("evenly spread styles are inconsistent", () => {
    const even = calculateConsistency([
      { name: "a", weight: 0.25 },
      { name: "b", weight: 0.25 },
      { name: "c", weight: 0.25 },
      { name: "d", weight: 0.25 },
    ]);
    expect(even).toBeLessThan(15);
  });

  it("is clamped to 0..100", () => {
    const v = calculateConsistency([
      { name: "a", weight: 0.5 },
      { name: "b", weight: 0.5 },
    ]);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});

describe("mergeStyleDNA", () => {
  it("first image creates a profile with imageCount 1 and an id", () => {
    const dna = mergeStyleDNA(null, analysis());
    expect(dna.imageCount).toBe(1);
    expect(dna.id).toBeTruthy();
    expect(dna.palette.length).toBeGreaterThan(0);
  });

  it("second image increments count and blends style weights", () => {
    const first = mergeStyleDNA(null, analysis({ styles: [{ name: "swiss", weight: 1 }] }));
    const merged = mergeStyleDNA(first, analysis({ styles: [{ name: "brutalism", weight: 1 }] }));
    expect(merged.imageCount).toBe(2);
    const names = merged.styles.map((s) => s.name);
    expect(names).toContain("swiss");
    expect(names).toContain("brutalism");
    // Two equally-weighted single-style images → ~50/50.
    const swiss = merged.styles.find((s) => s.name === "swiss")!;
    expect(swiss.weight).toBeGreaterThan(0.3);
    expect(swiss.weight).toBeLessThan(0.7);
  });

  it("survives malformed model output without throwing", () => {
    // mood as a string, styles missing weights, palette entries junk
    const bad = {
      palette: [{ hex: "#fff", name: "x", weight: "nope" }, "junk"],
      styles: [{ name: "ok", weight: 0.5 }, { weight: 1 }],
      mood: "serene",
      composition: null,
      techniques: undefined,
      influences: [123, "Rams"],
      summary: 42,
    } as unknown as StyleAnalysis;
    const dna = mergeStyleDNA(null, bad);
    expect(dna.mood).toEqual(["serene"]); // string coerced to array
    expect(dna.influences).toEqual(["Rams"]); // non-strings dropped
    expect(dna.summary).toBe(""); // non-string summary → empty
    expect(dna.palette).toEqual([]); // junk palette dropped
  });

  it("clamps out-of-range weights into [0,1]", () => {
    const dna = mergeStyleDNA(
      null,
      analysis({
        palette: [{ hex: "#123456", name: "x", weight: 5 }],
        styles: [{ name: "a", weight: -2 }],
      })
    );
    expect(dna.palette[0].weight).toBeLessThanOrEqual(1);
    expect(dna.palette[0].weight).toBeGreaterThanOrEqual(0);
    expect(dna.styles[0].weight).toBeGreaterThanOrEqual(0);
    expect(dna.styles[0].weight).toBeLessThanOrEqual(1);
  });
});
