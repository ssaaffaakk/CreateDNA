import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StyleDNA } from "./style-dna";

interface PortfolioImage {
  id: string;
  name: string;
  thumbnail: string;
  analyzedAt: string;
}

interface AppState {
  styleDNA: StyleDNA | null;
  images: PortfolioImage[];
  isAnalyzing: boolean;
  currentProject: ProjectBrief | null;
  generatedOutput: GeneratedOutput | null;

  setStyleDNA: (dna: StyleDNA) => void;
  addImage: (img: PortfolioImage) => void;
  setAnalyzing: (v: boolean) => void;
  setCurrentProject: (p: ProjectBrief | null) => void;
  setGeneratedOutput: (o: GeneratedOutput | null) => void;
  reset: () => void;
}

export interface ProjectBrief {
  description: string;
  platform: string;
  audience: string;
  constraints: string;
}

export interface GeneratedOutput {
  moodboard: string[];
  palette: string[];
  typography: string;
  tone: string;
  prompts: PromptExport[];
  brief: string;
}

export interface PromptExport {
  tool: string;
  prompt: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      styleDNA: null,
      images: [],
      isAnalyzing: false,
      currentProject: null,
      generatedOutput: null,

      setStyleDNA: (dna) => set({ styleDNA: dna }),
      addImage: (img) =>
        set((s) => ({ images: [...s.images, img] })),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setCurrentProject: (p) => set({ currentProject: p }),
      setGeneratedOutput: (o) => set({ generatedOutput: o }),
      reset: () =>
        set({
          styleDNA: null,
          images: [],
          currentProject: null,
          generatedOutput: null,
        }),
    }),
    { name: "creative-dna-store" }
  )
);
