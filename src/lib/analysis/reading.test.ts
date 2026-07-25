import { describe, it, expect } from "vitest";
import { computeImageFeatures } from "./image-features";
import { featuresToDescriptors } from "./descriptors";
import { classifyMovements } from "./taxonomy";

const W = 160;
const H = 160;
function make(fill: (x: number, y: number) => [number, number, number]) {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [r, g, b] = fill(x, y);
      const i = (y * W + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  return d;
}
const read = (d: Uint8ClampedArray) => {
  const f = computeImageFeatures(d, W, H);
  return { f, desc: featuresToDescriptors(f), movements: classifyMovements(f) };
};

// Archetypes
const swiss = make((x, y) =>
  (x > 20 && x < 24) || (y > 30 && y < 34) || (x > 40 && x < 72 && y > 60 && y < 92)
    ? [26, 26, 46]
    : [245, 242, 232]
);
const pop = make((x) => (x < W / 2 ? [230, 30, 30] : [20, 210, 210]));
const mono = make((x, y) => { const v = Math.floor(((x + y) / (W + H)) * 255); return [v, v, v]; });

describe("reading pipeline — determinism", () => {
  it("same image → identical descriptors + movements", () => {
    const a = read(swiss);
    const b = read(swiss.slice());
    expect(a.desc).toEqual(b.desc);
    expect(a.movements).toEqual(b.movements);
  });

  it("movement weights normalise to ~1", () => {
    for (const img of [swiss, pop, mono]) {
      const { movements } = read(img);
      const sum = movements.reduce((s, m) => s + m.weight, 0);
      expect(sum).toBeGreaterThan(0.98);
      expect(sum).toBeLessThan(1.02);
    }
  });
});

describe("reading pipeline — sensible output", () => {
  it("swiss archetype → negative-space/minimal composition + Swiss/Minimalism movement", () => {
    const { desc, movements } = read(swiss);
    expect(desc.composition.some((c) => /negative space|minimal/.test(c))).toBe(true);
    const names = movements.map((m) => m.name);
    expect(names.some((n) => n === "Swiss Modernism" || n === "Minimalism")).toBe(true);
  });

  it("pop archetype → vivid/bold mood, high-saturation technique", () => {
    const { desc } = read(pop);
    expect(desc.mood.some((m) => /vibrant|bold|energetic/.test(m))).toBe(true);
    expect(desc.technique.some((t) => /high-saturation|high contrast/.test(t))).toBe(true);
    expect(desc.harmony).toBe("complementary");
  });

  it("greyscale → muted technique, tonal movement, balanced temperature", () => {
    const { desc, movements } = read(mono);
    expect(desc.temperature).toBe("balanced");
    expect(desc.technique).toContain("muted palette");
    expect(movements.map((m) => m.name)).toContain("Tonal / Monochrome");
  });
});
