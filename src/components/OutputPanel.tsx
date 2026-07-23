"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function OutputPanel() {
  const { generatedOutput, styleDNA } = useAppStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!generatedOutput) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExport = async (format: "json" | "markdown" | "system-prompt") => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleDNA, format }),
      });
      const data = await res.json();
      const content =
        typeof data.export === "string"
          ? data.export
          : JSON.stringify(data.export, null, 2);

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creative-dna.${format === "json" ? "json" : format === "markdown" ? "md" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <h2 className="text-xl font-semibold">Your project kit</h2>

      {/* Rewritten Brief */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Brief — in your voice
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          {generatedOutput.brief}
        </p>
      </div>

      {/* Palette */}
      {generatedOutput.palette && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Project palette
          </h3>
          <div className="flex gap-2">
            {generatedOutput.palette.map((hex) => (
              <div key={hex} className="text-center">
                <div
                  className="w-14 h-14 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: hex }}
                  onClick={() => navigator.clipboard.writeText(hex)}
                  title={`Click to copy ${hex}`}
                />
                <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography & Tone */}
      <div className="grid grid-cols-2 gap-4">
        {generatedOutput.typography && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Typography
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {generatedOutput.typography}
            </p>
          </div>
        )}
        {generatedOutput.tone && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Tone of voice
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {generatedOutput.tone}
            </p>
          </div>
        )}
      </div>

      {/* AI Prompts — Portable */}
      {generatedOutput.prompts && generatedOutput.prompts.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
            Ready-to-use prompts — your DNA, any tool
          </h3>
          <div className="space-y-2">
            {generatedOutput.prompts.map((p, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                    {p.tool}
                  </span>
                  <button
                    onClick={() => copyToClipboard(p.prompt, i)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    {copiedIndex === i ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed">
                  {p.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          Export your creative DNA
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="flex-1 py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            JSON
          </button>
          <button
            onClick={() => handleExport("markdown")}
            disabled={exporting}
            className="flex-1 py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Markdown
          </button>
          <button
            onClick={() => handleExport("system-prompt")}
            disabled={exporting}
            className="flex-1 py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            System prompt
          </button>
        </div>
      </div>
    </motion.div>
  );
}
