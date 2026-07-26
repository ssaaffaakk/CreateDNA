"use client";

import { MotionConfig } from "framer-motion";
import UploadZone from "@/components/UploadZone";
import StyleDNAPanel from "@/components/StyleDNAPanel";
import BrandChecker from "@/components/BrandChecker";
import ProjectBriefForm from "@/components/ProjectBriefForm";
import OutputPanel from "@/components/OutputPanel";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { MOCK_DNA, MOCK_OUTPUT } from "@/lib/mock-data";

export default function Home() {
  const { styleDNA, generatedOutput, reset, images, setStyleDNA, setGeneratedOutput, isEditingBrief } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);

  // The example profile carries a fixed id; recognise it so it can be clearly
  // labelled and never mistaken for the user's own data.
  const isDemo = styleDNA?.id === MOCK_DNA.id;

  const loadDemo = () => {
    setStyleDNA(MOCK_DNA);
    setGeneratedOutput(MOCK_OUTPUT);
  };

  // While editing a brief, a kit may still exist (the user is starting another
  // project) — treat that as the generate step, not the finished step.
  const step = !styleDNA ? 0 : !generatedOutput || isEditingBrief ? 1 : 2;

  return (
    // The globals.css reduced-motion rule only covers CSS animations; Framer
    // Motion runs in JS and needs to be told to honour the preference too.
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative max-w-3xl mx-auto px-6 py-3 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-base font-semibold tracking-tight leading-tight">
              Create
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-accent), #e94560, var(--color-cool))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                DNA
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500 leading-tight">
              Powered by IBM Granite
            </p>
          </div>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
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
                onClick={() => {
                  if (confirmReset) {
                    reset();
                    setConfirmReset(false);
                  } else {
                    // Two-step so one stray click can't wipe a real profile.
                    setConfirmReset(true);
                    setTimeout(() => setConfirmReset(false), 3000);
                  }
                }}
                className={`text-xs transition-colors px-2 py-1 rounded-lg ${
                  confirmReset
                    ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 font-medium"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {confirmReset ? "Confirm?" : "Reset"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Demo banner: the example must never masquerade as the user's data. */}
        {isDemo && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 px-4 py-2.5">
            <p className="text-[13px] text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-[var(--color-accent)]">
                Example profile
              </span>{" "}
              — sample data, not yours. Upload your own work to start a real one.
            </p>
            <button
              onClick={reset}
              className="shrink-0 self-start sm:self-auto text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
              Exit example
            </button>
          </div>
        )}

        {/* Landing hero — only when no DNA. Plain conditional render, not
            AnimatePresence: whether the landing disappears must not depend on
            an exit animation completing. */}
        {!styleDNA && images.length === 0 && (
          <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-[26px] sm:text-4xl font-bold tracking-tight leading-[1.15] text-balance">
                  Your{" "}
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, var(--color-accent), #e94560, var(--color-cool))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    DNA
                  </span>
                  , on every AI
                </h2>
                <p className="text-sm sm:text-base text-zinc-500 max-w-lg mx-auto leading-relaxed text-pretty">
                  AI blurs everyone into the same look. Upload your work and
                  CreateDNA turns your visual identity into a portable palette
                  and system prompt — so Midjourney, ChatGPT and Canva all stay
                  on brand.
                </p>
              </div>

              {/* Before-use instructions: what the tool does, in three steps.
                  Full descriptions stay visible on mobile (stacked) rather than
                  being truncated. */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 text-center">
                  How it works
                </h3>
                <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-left">
                  {[
                    {
                      n: 1,
                      title: "Upload your work",
                      desc: "Drop 2–5 pieces. A vision model reads the palette, composition and technique in each.",
                    },
                    {
                      n: 2,
                      title: "Get your Creative DNA",
                      desc: "Your style is distilled into structured, machine-readable data — colors, styles, mood, techniques.",
                    },
                    {
                      n: 3,
                      title: "Generate a project kit",
                      desc: "Any brief becomes prompts and a system prompt — written the way AI tools understand, in your style.",
                    },
                  ].map((s) => (
                    <li
                      key={s.n}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5"
                    >
                      <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[var(--color-accent)] text-xs font-semibold flex items-center justify-center tabular-nums">
                        {s.n}
                      </span>
                      <p className="text-[13px] font-medium leading-tight">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-snug">
                        {s.desc}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
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

        {/* On-Brand Checker: score any image against the DNA signature. Renders
            only once a signature exists (self-guards on styleDNA.features). */}
        <BrandChecker />

        {/* Plain conditional render (like the landing hero), NOT AnimatePresence
            mode="wait": gating the output panel on the brief form's EXIT
            animation deadlocks whenever rAF is paused (a backgrounded tab),
            leaving the workflow stuck. The panels use initial={false} internally,
            so they appear instantly. */}
        {styleDNA && (!generatedOutput || isEditingBrief) && <ProjectBriefForm />}
        {generatedOutput && !isEditingBrief && <OutputPanel />}

        <footer className="text-center text-[11px] text-zinc-400 py-8 border-t border-zinc-100 dark:border-zinc-800/50">
          Built with IBM Granite on watsonx.ai · IBM AI Builders Challenge 2026
        </footer>
      </main>
    </div>
    </MotionConfig>
  );
}
