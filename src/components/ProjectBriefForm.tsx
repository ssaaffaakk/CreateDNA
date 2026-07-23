"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function ProjectBriefForm() {
  const { styleDNA, setGeneratedOutput } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState({
    description: "",
    platform: "",
    audience: "",
    constraints: "",
  });

  if (!styleDNA) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleDNA, brief }),
      });
      const data = await res.json();
      if (data.output) {
        setGeneratedOutput(data.output);
      }
    } catch (err) {
      console.error("Generation failed:", err);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <h2 className="text-xl font-semibold">New project</h2>
      <p className="text-sm text-zinc-500">
        Describe your project — AI will prepare everything in YOUR style.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-zinc-500 block mb-1">
            What are you creating?
          </label>
          <textarea
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
            rows={3}
            placeholder="e.g., Instagram campaign for a coffee brand launch..."
            value={brief.description}
            onChange={(e) =>
              setBrief((b) => ({ ...b, description: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-500 block mb-1">
              Platform
            </label>
            <input
              className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              placeholder="Instagram, TikTok, Web..."
              value={brief.platform}
              onChange={(e) =>
                setBrief((b) => ({ ...b, platform: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-500 block mb-1">
              Audience
            </label>
            <input
              className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              placeholder="25-35, tech-savvy..."
              value={brief.audience}
              onChange={(e) =>
                setBrief((b) => ({ ...b, audience: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-zinc-500 block mb-1">
            Constraints
          </label>
          <input
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
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
        disabled={loading || !brief.description}
        className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating in your style...
          </>
        ) : (
          "Generate project kit"
        )}
      </button>
    </motion.div>
  );
}
