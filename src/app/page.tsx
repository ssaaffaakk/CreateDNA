"use client";

import { motion, AnimatePresence, MotionConfig } from "framer-motion";
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
    // The globals.css reduced-motion rule only covers CSS animations; Framer
    // Motion runs in JS and needs to be told to honour the preference too.
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              D
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                CreateDNA
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
        {/* Landing hero — only when no DNA. Plain conditional render, not
            AnimatePresence: whether the landing disappears must not depend on
            an exit animation completing. */}
        {!styleDNA && images.length === 0 && (
          <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-[26px] sm:text-4xl font-bold tracking-tight leading-[1.15] text-balance">
                  Your style,{" "}
                  <span className="text-[var(--color-accent)]">
                    readable by any AI
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-zinc-500 max-w-lg mx-auto leading-relaxed text-pretty">
                  Drop in your work. We read the palette, composition and
                  technique behind it — then write the prompts that reproduce
                  it anywhere.
                </p>
              </div>

              {/* The three steps, shown as the actual pipeline rather than
                  prose — step 1 is the upload control directly below. */}
              <ol className="flex items-stretch justify-center gap-1.5 sm:gap-3 text-left">
                {[
                  { n: 1, short: "Upload", label: "Upload work", sub: "2–5 pieces" },
                  { n: 2, short: "Read DNA", label: "Read the DNA", sub: "palette + style" },
                  { n: 3, short: "Generate", label: "Generate", sub: "kit + prompts" },
                ].map((s) => (
                  <li
                    key={s.n}
                    className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-2 sm:px-3 py-2"
                  >
                    <span className="shrink-0 w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-500 flex items-center justify-center tabular-nums">
                      {s.n}
                    </span>
                    <span className="min-w-0">
                      {/* Short labels below sm so nothing truncates on a phone */}
                      <span className="block text-[12px] sm:text-[13px] font-medium leading-tight">
                        <span className="sm:hidden">{s.short}</span>
                        <span className="hidden sm:inline">{s.label}</span>
                      </span>
                      <span className="hidden sm:block text-[11px] text-zinc-400 leading-tight truncate">
                        {s.sub}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
          </div>
        )}

        <UploadZone />

        {/* Show the product's actual output before anything is uploaded — the
            palette bar is real MOCK_DNA data, the same shape a real analysis
            produces, so the page demonstrates itself instead of describing. */}
        {!styleDNA && images.length === 0 && (
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/70">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Example profile
                </p>
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  from {MOCK_DNA.imageCount} pieces
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* Weighted palette strand — widths are the real colour weights */}
                <div className="flex h-10 sm:h-12 rounded-lg overflow-hidden">
                  {MOCK_DNA.palette.map((c) => (
                    <div
                      key={c.hex}
                      style={{
                        backgroundColor: c.hex,
                        flexGrow: Math.max(c.weight, 0.05),
                      }}
                      title={`${c.name} ${c.hex}`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {MOCK_DNA.styles.slice(0, 3).map((s) => (
                    <span
                      key={s.name}
                      className="text-[11px] px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize"
                    >
                      {s.name}
                    </span>
                  ))}
                  {MOCK_DNA.techniques.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={loadDemo}
                  className="w-full sm:w-auto text-sm font-medium px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors active:scale-[0.99]"
                >
                  Open this example →
                </button>
              </div>
          </section>
        )}

        <StyleDNAPanel />

        <AnimatePresence mode="wait">
          {styleDNA && !generatedOutput && (
            <motion.div
              key="brief-form"
              // The product surfaces themselves never fade in — only the
              // transition between them animates. A dropped animation frame
              // must not leave the main workflow invisible.
              initial={false}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            >
              <ProjectBriefForm />
            </motion.div>
          )}
          {generatedOutput && (
            <motion.div key="output-panel" initial={false}>
              <OutputPanel />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center text-[11px] text-zinc-400 py-8 border-t border-zinc-100 dark:border-zinc-800/50">
          Built with IBM Granite on watsonx.ai · IBM AI Builders Challenge 2026
        </footer>
      </main>
    </div>
    </MotionConfig>
  );
}
