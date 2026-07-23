"use client";

import { motion, AnimatePresence } from "framer-motion";
import UploadZone from "@/components/UploadZone";
import StyleDNAPanel from "@/components/StyleDNAPanel";
import ProjectBriefForm from "@/components/ProjectBriefForm";
import OutputPanel from "@/components/OutputPanel";
import { useAppStore } from "@/lib/store";
import { MOCK_DNA, MOCK_OUTPUT } from "@/lib/mock-data";

export default function Home() {
  const { styleDNA, generatedOutput, reset, images, setStyleDNA, setGeneratedOutput } = useAppStore();

  const loadDemo = () => {
    setStyleDNA(MOCK_DNA);
    setGeneratedOutput(MOCK_OUTPUT);
  };

  const step = !styleDNA ? 0 : !generatedOutput ? 1 : 2;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              D
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                CreativeDNA
              </h1>
              <p className="text-[11px] text-zinc-500 leading-tight">
                Powered by IBM Granite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {styleDNA && (
              <div className="hidden sm:flex items-center gap-1.5">
                {[0, 1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      s <= step
                        ? "w-6 bg-[var(--color-accent)]"
                        : "w-3 bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
            )}
            {styleDNA && (
              <button
                onClick={reset}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Landing hero — only when no DNA */}
        <AnimatePresence>
          {!styleDNA && images.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="text-center space-y-5 pt-8 pb-4"
            >
              <div className="inline-flex items-center gap-2 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                IBM AI Builders Challenge 2026
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                AI that learns
                <br />
                <span className="text-[var(--color-accent)]">who you are</span>
                <br />
                as a creator
              </h2>

              <p className="text-zinc-500 max-w-md mx-auto text-base leading-relaxed">
                Upload your portfolio. AI extracts your creative DNA — palette,
                style, mood, techniques — and generates project kits that sound
                like <em>you</em>.
              </p>

              <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  Upload work
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  See your DNA
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  Generate in your style
                </span>
              </div>

              <button
                onClick={loadDemo}
                className="mt-4 text-sm text-zinc-400 hover:text-[var(--color-accent)] transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-[var(--color-accent)]"
              >
                See a demo with sample data
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <UploadZone />

        <StyleDNAPanel />

        <AnimatePresence mode="wait">
          {styleDNA && !generatedOutput && (
            <motion.div
              key="brief-form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3 }}
            >
              <ProjectBriefForm />
            </motion.div>
          )}
          {generatedOutput && (
            <motion.div
              key="output-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <OutputPanel />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center text-[11px] text-zinc-400 py-8 border-t border-zinc-100 dark:border-zinc-800/50">
          Built with IBM Granite 4.1 · IBM AI Builders Challenge 2026
        </footer>
      </main>
    </div>
  );
}
