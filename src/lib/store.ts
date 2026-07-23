import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StyleDNA } from "./style-dna";

export interface PortfolioImage {
  id: string;
  name: string;
  thumbnail: string;
  analyzedAt: string;
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

interface AppState {
  styleDNA: StyleDNA | null;
  images: PortfolioImage[];
  isAnalyzing: boolean;
  error: string | null;
  currentProject: ProjectBrief | null;
  generatedOutput: GeneratedOutput | null;

  setStyleDNA: (dna: StyleDNA) => void;
  addImage: (img: PortfolioImage) => void;
  removeImage: (id: string) => void;
  setAnalyzing: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setCurrentProject: (p: ProjectBrief | null) => void;
  setGeneratedOutput: (o: GeneratedOutput | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      styleDNA: null,
      images: [],
      isAnalyzing: false,
      error: null,
      currentProject: null,
      generatedOutput: null,

      setStyleDNA: (dna) => set({ styleDNA: dna }),
      addImage: (img) => set((s) => ({ images: [...s.images, img] })),
      removeImage: (id) =>
        set((s) => ({ images: s.images.filter((i) => i.id !== id) })),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setError: (msg) => set({ error: msg }),
      setCurrentProject: (p) => set({ currentProject: p }),
      setGeneratedOutput: (o) => set({ generatedOutput: o }),
      reset: () =>
        set({
          styleDNA: null,
          images: [],
          error: null,
          currentProject: null,
          generatedOutput: null,
        }),
    }),
    { name: "creative-dna-store" }
  )
);
