import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateConsistency } from "./style-dna";
import type { ColorEntry, StyleDNA, StyleWeight } from "./style-dna";

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

/* -------------------------------------------------------------------------
 * Persisted schema
 *
 * localStorage is untrusted input: a blob may have been written by an older
 * build, truncated by a quota error, or edited by hand. The write path is
 * already validated (API routes + sanitizeAnalysis); this guards the READ
 * path, which is where old data actually enters.
 * ---------------------------------------------------------------------- */

// Bump on every breaking change to the persisted shape. Zustand stamps blobs
// `version: 0` by default, so v0 covers every historical StyleDNA — including
// the pre-consistencyScore shape and kits written before the response was
// validated. Without bumping this, a migrate function would never run.
const PERSIST_VERSION = 1;

type PersistedState = Pick<
  AppState,
  "styleDNA" | "images" | "currentProject" | "generatedOutput"
>;

const EMPTY_PERSISTED: PersistedState = {
  styleDNA: null,
  images: [],
  currentProject: null,
  generatedOutput: null,
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");

const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

// Structural fields the UI maps/slices over are strict — a wrong type discards
// the whole profile rather than deep-repairing it. consistencyScore is always
// recomputed because its meaning changed between versions (hardcoded 100 ->
// entropy of style weights), so a persisted number cannot be trusted.
function sanitizeStyleDNA(value: unknown): StyleDNA | null {
  if (!isRecord(value)) return null;

  const { palette, styles, composition, mood, techniques, influences, imageCount } = value;

  if (!Array.isArray(palette) || !Array.isArray(styles)) return null;
  if (
    !isStringArray(composition) ||
    !isStringArray(mood) ||
    !isStringArray(techniques) ||
    !isStringArray(influences)
  ) {
    return null;
  }
  if (typeof imageCount !== "number" || !Number.isFinite(imageCount)) return null;

  const cleanPalette: ColorEntry[] = palette.filter(
    (c): c is ColorEntry =>
      isRecord(c) &&
      typeof c.hex === "string" &&
      typeof c.name === "string" &&
      typeof c.weight === "number" &&
      Number.isFinite(c.weight)
  );

  const cleanStyles: StyleWeight[] = styles.filter(
    (s): s is StyleWeight =>
      isRecord(s) &&
      typeof s.name === "string" &&
      typeof s.weight === "number" &&
      Number.isFinite(s.weight)
  );

  const now = new Date().toISOString();

  return {
    id: asString(value.id, "migrated-profile"),
    createdAt: asString(value.createdAt, now),
    updatedAt: asString(value.updatedAt, now),
    imageCount: Math.max(1, Math.floor(imageCount)),
    palette: cleanPalette,
    styles: cleanStyles,
    composition,
    mood,
    techniques,
    influences,
    summary: asString(value.summary),
    consistencyScore: calculateConsistency(cleanStyles),
  };
}

function sanitizeImages(value: unknown): PortfolioImage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (img): img is PortfolioImage =>
      isRecord(img) &&
      typeof img.id === "string" &&
      typeof img.name === "string" &&
      typeof img.analyzedAt === "string" &&
      // Thumbnails are always canvas-produced data URLs; anything else did not
      // come from this app and must not become an <img src>.
      typeof img.thumbnail === "string" &&
      img.thumbnail.startsWith("data:image/")
  );
}

// Kits generated before /api/generate validated its response could hold a
// palette of objects or a non-string brief, both of which crash OutputPanel.
function sanitizeOutput(value: unknown): GeneratedOutput | null {
  if (!isRecord(value)) return null;

  const { brief, palette, moodboard, prompts } = value;

  if (typeof brief !== "string") return null;
  if (!isStringArray(palette) || !isStringArray(moodboard)) return null;
  if (!Array.isArray(prompts)) return null;

  return {
    brief,
    palette,
    moodboard,
    prompts: prompts.filter(
      (p): p is PromptExport =>
        isRecord(p) && typeof p.tool === "string" && typeof p.prompt === "string"
    ),
    typography: asString(value.typography),
    tone: asString(value.tone),
  };
}

function sanitizeProject(value: unknown): ProjectBrief | null {
  if (!isRecord(value)) return null;
  return {
    description: asString(value.description),
    platform: asString(value.platform),
    audience: asString(value.audience),
    constraints: asString(value.constraints),
  };
}

// Must never throw: zustand swallows a throw from migrate/merge, which would
// leave the bad blob in storage to fail again on every future load.
function sanitizePersisted(value: unknown): PersistedState {
  if (!isRecord(value)) return EMPTY_PERSISTED;
  return {
    styleDNA: sanitizeStyleDNA(value.styleDNA),
    images: sanitizeImages(value.images),
    currentProject: sanitizeProject(value.currentProject),
    generatedOutput: sanitizeOutput(value.generatedOutput),
  };
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
          // Without this a reset during analysis leaves isAnalyzing stuck true
          // and UploadZone's concurrency guard refuses every later upload.
          isAnalyzing: false,
          error: null,
          currentProject: null,
          generatedOutput: null,
        }),
    }),
    {
      name: "creative-dna-store",
      version: PERSIST_VERSION,
      // Transient UI state must never survive a reload. A tab closed mid
      // analysis used to persist isAnalyzing: true; on the next visit the
      // spinner returned with no progress text and the upload guard
      // (`if (getState().isAnalyzing) return`) blocked every upload forever.
      partialize: (state): PersistedState => ({
        styleDNA: state.styleDNA,
        images: state.images,
        currentProject: state.currentProject,
        generatedOutput: state.generatedOutput,
      }),
      // Runs only on a version mismatch — once per user for blobs written
      // before PERSIST_VERSION existed.
      migrate: (persisted): PersistedState => sanitizePersisted(persisted),
      // Runs on EVERY hydration, so same-version blobs that were truncated by
      // a quota error or hand-edited are validated too.
      merge: (persisted, current): AppState => ({
        ...current,
        ...sanitizePersisted(persisted),
      }),
    }
  )
);
