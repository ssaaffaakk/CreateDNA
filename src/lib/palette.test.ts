import { describe, it, expect } from "vitest";
import { extractDominantColors, nameColor } from "./palette";

function rgba(pixels: Array<[number, number, number, number?]>) {
  const d = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b, a = 255], i) => {
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = a;
  });
  return d;
}

describe("nameColor", () => {
  it("names hues from the true colour", () => {
    expect(nameColor("#1E6F5C")).toBe("Deep Teal");
    expect(nameColor("#E8A33D")).toBe("Orange");
    expect(nameColor("#000000")).toBe("Near Black");
    expect(nameColor("#FFFFFF")).toBe("White");
  });

  it("light low-chroma warm tones read as Cream, not Light Amber", () => {
    expect(nameColor("#F2E9D8")).toBe("Cream");
    expect(nameColor("#F5F5DC")).toBe("Cream");
  });

  it("invalid hex degrades to 'Color'", () => {
    expect(nameColor("nope")).toBe("Color");
  });
});

describe("extractDominantColors", () => {
  it("finds the dominant colours with weights summing to ~1", () => {
    // 60% red, 30% green, 10% blue
    const px: Array<[number, number, number]> = [];
    for (let i = 0; i < 60; i++) px.push([220, 20, 20]);
    for (let i = 0; i < 30; i++) px.push([20, 200, 20]);
    for (let i = 0; i < 10; i++) px.push([20, 20, 210]);
    const out = extractDominantColors(rgba(px), 6);
    const sum = out.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeGreaterThan(0.98);
    expect(sum).toBeLessThan(1.02);
    // Most-frequent colour first, and it should be reddish.
    expect(out[0].hex[1]).toMatch(/[c-f]/i); // high red nibble
    expect(out.length).toBeLessThanOrEqual(6);
  });

  it("is deterministic", () => {
    const d = rgba([[10, 20, 30], [10, 20, 30], [200, 100, 50]]);
    expect(extractDominantColors(d.slice(), 6)).toEqual(extractDominantColors(d.slice(), 6));
  });

  it("skips fully transparent pixels", () => {
    const d = rgba([[255, 0, 0, 0], [255, 0, 0, 0], [0, 0, 255, 255]]);
    const out = extractDominantColors(d, 6);
    expect(out.length).toBe(1); // only the opaque blue survives
  });
});
