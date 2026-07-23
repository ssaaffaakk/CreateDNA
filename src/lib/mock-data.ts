import type { StyleDNA } from "./style-dna";
import type { GeneratedOutput } from "./store";

export const MOCK_DNA: StyleDNA = {
  id: "demo-dna-001",
  createdAt: "2026-07-20T10:00:00Z",
  updatedAt: "2026-07-23T14:30:00Z",
  imageCount: 4,
  consistencyScore: 78,
  palette: [
    { hex: "#1a1a2e", name: "Deep Navy", weight: 0.28 },
    { hex: "#e94560", name: "Coral Red", weight: 0.22 },
    { hex: "#f5f5dc", name: "Cream", weight: 0.18 },
    { hex: "#16213e", name: "Dark Slate", weight: 0.15 },
    { hex: "#0f3460", name: "Ocean Blue", weight: 0.10 },
    { hex: "#e8e8e8", name: "Soft Gray", weight: 0.07 },
  ],
  composition: [
    "asymmetric layout",
    "strong negative space",
    "rule-of-thirds",
    "vertical emphasis",
  ],
  styles: [
    { name: "swiss modernism", weight: 0.35 },
    { name: "japanese minimalism", weight: 0.25 },
    { name: "editorial design", weight: 0.20 },
    { name: "bauhaus", weight: 0.12 },
    { name: "art deco", weight: 0.08 },
  ],
  mood: ["refined", "bold", "contemplative", "sophisticated"],
  techniques: [
    "flat color fields",
    "geometric shapes",
    "tight typography",
    "negative space",
    "limited palette",
  ],
  influences: [
    "Josef Muller-Brockmann",
    "Kenya Hara",
    "Massimo Vignelli",
    "Dieter Rams",
  ],
  summary:
    "A refined visual identity blending Swiss modernist precision with Japanese minimalist restraint. Strong use of negative space, asymmetric compositions, and a controlled palette dominated by deep navy and coral red. Typography is tight and purposeful. The work communicates sophistication through restraint — every element earns its place.",
};

export const MOCK_OUTPUT: GeneratedOutput = {
  brief:
    "A brand identity system for an artisanal coffee roastery that speaks through restraint. The visual language draws from my Swiss-Japanese hybrid aesthetic — deep navy grounds the brand in seriousness, while coral red accents signal the warmth of craft. Every touchpoint should feel like a quiet gallery, not a loud cafe.",
  palette: ["#1a1a2e", "#e94560", "#f5f5dc", "#2c3e50", "#c0392b"],
  typography:
    "Primary: Neue Haas Grotesk (clean Swiss precision). Secondary: Noto Serif JP (subtle Japanese warmth). Use the sans-serif for headings and UI, the serif for body copy and storytelling moments. The contrast mirrors your Swiss-Japanese style tension.",
  tone: "Measured and confident. Speak in short, declarative sentences. Avoid exclamation marks — let the work speak. Use precise language over flowery descriptions. Think curator, not salesperson.",
  moodboard: [
    "japanese ceramics",
    "brutalist architecture",
    "swiss posters",
    "film noir lighting",
    "wabi-sabi texture",
  ],
  prompts: [
    {
      tool: "Midjourney",
      prompt:
        "Minimalist coffee brand identity, Swiss modernist grid layout, deep navy #1a1a2e and coral red #e94560 on cream background, asymmetric composition, strong negative space, geometric shapes, Muller-Brockmann inspired typography, Japanese minimalist influence, editorial design, refined and sophisticated mood --ar 3:4 --style raw --v 6.1",
    },
    {
      tool: "DALL-E",
      prompt:
        "A minimalist coffee brand poster in Swiss modernist style. Deep navy and coral red color scheme on cream paper. Asymmetric layout with strong negative space. Geometric shapes and tight Helvetica typography. Japanese minimalist influence with wabi-sabi texture. Sophisticated and contemplative mood. Editorial design quality.",
    },
    {
      tool: "ChatGPT",
      prompt:
        "You are a brand copywriter for an artisanal coffee roastery. Write in a measured, confident tone — short declarative sentences, no exclamation marks. Channel Swiss precision and Japanese minimalism: every word must earn its place. Favor concrete sensory details over abstract descriptions. Think curator, not salesperson. The brand values restraint, craft, and quiet sophistication.",
    },
    {
      tool: "Canva",
      prompt:
        "Use a deep navy (#1a1a2e) background with coral red (#e94560) accent elements. Keep layouts asymmetric with generous whitespace (at least 30% negative space). Use Helvetica Neue or Inter for headings, limit to 2 font weights. Align elements to a grid but break it intentionally once per composition. Keep imagery minimal and geometric.",
    },
  ],
};
