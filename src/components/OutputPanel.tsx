"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function OutputPanel() {
  const { generatedOutput, setEditingBrief } = useAppStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!generatedOutput) return null;

  // clipboard is absent on insecure (non-HTTPS) origins; guard so a copy click
  // degrades to a no-op instead of throwing an unhandled error.
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      // The kit is the deliverable — it must be readable even if the entry
      // animation never runs (background tab, stalled frame, slow device).
      // initial={false} stops the hidden variant from propagating to children.
      initial={false}
      animate="show"
      variants={stagger}
      className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Your project kit
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Generated from your Creative DNA
          </p>
        </div>
        {/* Start another brief while KEEPING this kit — it sets a view flag
            instead of clearing the output, and the brief form offers a
            "Back to kit" button, so the generated kit is never lost. */}
        <button
          onClick={() => setEditingBrief(true)}
          className="shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-[var(--color-accent)] px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-[var(--color-accent)] transition-colors active:scale-[0.98]"
        >
          + New project
        </button>
      </motion.div>

      {/* Rewritten Brief */}
      <motion.div variants={fadeUp}>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Brief — in your voice
        </h3>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          {generatedOutput.brief}
        </div>
      </motion.div>

      {/* Palette */}
      {generatedOutput.palette && generatedOutput.palette.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Project palette
          </h3>
          <div className="flex gap-2">
            {generatedOutput.palette.map((hex) => (
              <motion.div
                key={hex}
                className="text-center cursor-pointer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copyHex(hex)}
              >
                <div
                  className="w-14 h-14 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                  {copiedHex === hex ? "Copied!" : hex}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Typography & Tone */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {generatedOutput.typography && (
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Typography
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {generatedOutput.typography}
            </p>
          </div>
        )}
        {generatedOutput.tone && (
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Tone of voice
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {generatedOutput.tone}
            </p>
          </div>
        )}
      </motion.div>

      {/* AI Prompts */}
      {generatedOutput.prompts && generatedOutput.prompts.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
            Ready-to-use prompts — your DNA, any tool
          </h3>
          <div className="space-y-2">
            {generatedOutput.prompts.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:border-[var(--color-accent)]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-accent)] bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg">
                    {p.tool}
                  </span>
                  <button
                    onClick={() => copyToClipboard(p.prompt, i)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                  >
                    {copiedIndex === i ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {p.prompt}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
