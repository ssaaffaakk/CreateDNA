"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function StyleDNAPanel() {
  const { styleDNA } = useAppStore();

  if (!styleDNA) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Creative DNA</h2>
        <span className="text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded-full">
          {styleDNA.imageCount} piece{styleDNA.imageCount !== 1 ? "s" : ""} analyzed
        </span>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {styleDNA.summary}
      </p>

      {/* Color Palette */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          Palette
        </h3>
        <div className="flex gap-2">
          {styleDNA.palette.slice(0, 6).map((color) => (
            <div key={color.hex} className="text-center">
              <div
                className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700"
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.hex})`}
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {color.hex}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Style Weights */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          Style DNA
        </h3>
        <div className="space-y-2">
          {styleDNA.styles.map((style) => (
            <div key={style.name} className="flex items-center gap-3">
              <span className="text-sm w-28 text-right text-zinc-600 dark:text-zinc-400 truncate">
                {style.name}
              </span>
              <div className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${style.weight * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
              <span className="text-xs text-zinc-500 w-10 font-mono">
                {Math.round(style.weight * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mood & Techniques */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Mood
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {styleDNA.mood.map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Techniques
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {styleDNA.techniques.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Influences */}
      {styleDNA.influences.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Influences
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {styleDNA.influences.join(" · ")}
          </p>
        </div>
      )}
    </motion.div>
  );
}
