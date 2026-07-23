"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

const tagVariant = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

export default function StyleDNAPanel() {
  const { styleDNA } = useAppStore();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!styleDNA) return null;

  const consistencyLabel =
    styleDNA.consistencyScore >= 80
      ? "Focused"
      : styleDNA.consistencyScore >= 50
        ? "Versatile"
        : "Eclectic";

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 dna-helix"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Your Creative DNA
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Built from {styleDNA.imageCount} piece
            {styleDNA.imageCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">
              Consistency
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${styleDNA.consistencyScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      styleDNA.consistencyScore >= 70
                        ? "var(--color-accent)"
                        : styleDNA.consistencyScore >= 40
                          ? "#eab308"
                          : "#6b7280",
                  }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                {styleDNA.consistencyScore}%
              </span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {consistencyLabel}
          </span>
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {styleDNA.summary}
      </p>

      {/* Color Palette */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          Palette
        </h3>
        <div className="flex gap-2 flex-wrap">
          <AnimatePresence mode="popLayout">
            {styleDNA.palette.slice(0, 6).map((color, i) => (
              <motion.div
                key={color.hex}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-center cursor-pointer group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copyColor(color.hex)}
                title={`${color.name} — click to copy`}
              >
                <div
                  className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm group-hover:shadow-md transition-shadow"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                  {copiedHex === color.hex ? "Copied!" : color.hex}
                </span>
                <span className="text-[9px] text-zinc-400 block truncate max-w-[48px]">
                  {color.name}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Style Weights */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          Style Profile
        </h3>
        <div className="space-y-2">
          {styleDNA.styles.map((style, i) => (
            <div key={style.name} className="flex items-center gap-3">
              <span className="text-sm w-32 text-right text-zinc-600 dark:text-zinc-400 truncate capitalize">
                {style.name}
              </span>
              <div className="flex-1 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${style.weight * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-light))`,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500 w-10 font-mono text-right">
                {Math.round(style.weight * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Composition */}
      {styleDNA.composition.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Composition
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              {styleDNA.composition.map((c, i) => (
                <motion.span
                  key={c}
                  layout
                  variants={tagVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: i * 0.03 }}
                  className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
                >
                  {c}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mood & Techniques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Mood
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              {styleDNA.mood.map((m, i) => (
                <motion.span
                  key={m}
                  layout
                  variants={tagVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: i * 0.03 }}
                  className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30"
                >
                  {m}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Techniques
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              {styleDNA.techniques.map((t, i) => (
                <motion.span
                  key={t}
                  layout
                  variants={tagVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: i * 0.03 }}
                  className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                >
                  {t}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Influences */}
      {styleDNA.influences.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Influences
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
            {styleDNA.influences.join(" · ")}
          </p>
        </div>
      )}
    </motion.div>
  );
}
