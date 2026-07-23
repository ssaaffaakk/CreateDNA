"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function ProjectBriefForm() {
  const { styleDNA, setGeneratedOutput } = useAppStore();
  const [loading, setLoading] = useState(false);
  // Local, not the shared store error — otherwise an upload error elsewhere
  // renders "Generation failed" here and offers a spurious retry.
  const [genError, setGenError] = useState<string | null>(null);
  const [brief, setBrief] = useState({
    description: "",
    platform: "",
    audience: "",
    constraints: "",
  });

  if (!styleDNA) return null;

  const handleGenerate = async () => {
    if (!brief.description.trim()) return;
    setLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleDNA, brief }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      if (data.output) {
        setGeneratedOutput(data.output);
      }
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Generation failed unexpectedly"
      );
    }
    setLoading(false);
  };

  const fieldCount = Object.values(brief).filter((v) => v.trim()).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight">New project</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Describe your project. AI generates everything in{" "}
          <span className="text-[var(--color-accent)] font-medium">
            your style
          </span>
          .
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="brief-description"
            className="text-xs uppercase tracking-wider text-zinc-500 block mb-1.5"
          >
            What are you creating?
          </label>
          <textarea
            id="brief-description"
            className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all"
            rows={3}
            placeholder="Instagram campaign for a coffee brand launch, minimalist poster series for a music festival..."
            value={brief.description}
            onChange={(e) =>
              setBrief((b) => ({ ...b, description: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="brief-platform"
              className="text-xs uppercase tracking-wider text-zinc-500 block mb-1.5"
            >
              Platform
            </label>
            <input
              id="brief-platform"
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all"
              placeholder="Instagram, Print, Web..."
              value={brief.platform}
              onChange={(e) =>
                setBrief((b) => ({ ...b, platform: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              htmlFor="brief-audience"
              className="text-xs uppercase tracking-wider text-zinc-500 block mb-1.5"
            >
              Audience
            </label>
            <input
              id="brief-audience"
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all"
              placeholder="Gen Z, professionals..."
              value={brief.audience}
              onChange={(e) =>
                setBrief((b) => ({ ...b, audience: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="brief-constraints"
            className="text-xs uppercase tracking-wider text-zinc-500 block mb-1.5"
          >
            Constraints
          </label>
          <input
            id="brief-constraints"
            className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all"
            placeholder="Budget, timeline, format requirements..."
            value={brief.constraints}
            onChange={(e) =>
              setBrief((b) => ({ ...b, constraints: e.target.value }))
            }
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !brief.description.trim()}
        className="w-full py-3 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating in your style...
          </>
        ) : (
          <>
            Generate project kit
            {fieldCount > 1 && (
              <span className="text-xs opacity-60">
                ({fieldCount}/4 fields)
              </span>
            )}
          </>
        )}
      </button>

      {!loading && genError && (
        <div role="alert" className="flex items-center gap-2 text-sm text-red-500">
          <span>{genError}</span>
          <button
            onClick={handleGenerate}
            className="underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300"
          >
            Try again
          </button>
        </div>
      )}
    </motion.div>
  );
}
