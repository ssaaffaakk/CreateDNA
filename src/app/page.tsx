"use client";

import UploadZone from "@/components/UploadZone";
import StyleDNAPanel from "@/components/StyleDNAPanel";
import ProjectBriefForm from "@/components/ProjectBriefForm";
import OutputPanel from "@/components/OutputPanel";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const { styleDNA, generatedOutput, reset } = useAppStore();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                CreativeDNA
              </h1>
              <p className="text-xs text-zinc-500">
                AI that knows who you are as a creator
              </p>
            </div>
          </div>
          {styleDNA && (
            <button
              onClick={reset}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Step 1: Upload */}
        {!styleDNA && (
          <div className="text-center space-y-4 py-12">
            <h2 className="text-3xl font-semibold tracking-tight">
              Teach AI your style
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto">
              Upload your portfolio. AI analyzes your work, extracts your
              creative DNA, and remembers who you are — so every tool speaks
              your language.
            </p>
          </div>
        )}

        <UploadZone />

        {/* Step 2: See your DNA */}
        <StyleDNAPanel />

        {/* Step 3: New project */}
        {styleDNA && !generatedOutput && <ProjectBriefForm />}

        {/* Step 4: Output */}
        <OutputPanel />

        {/* Footer */}
        <footer className="text-center text-xs text-zinc-400 py-8 border-t border-zinc-200 dark:border-zinc-800">
          Built with IBM Granite 4.1 &middot; Powered by IBM Bob IDE &middot;
          AI Builders Challenge 2026
        </footer>
      </main>
    </div>
  );
}
