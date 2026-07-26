"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { computeImageFeatures } from "@/lib/analysis/image-features";
import {
  onBrandScore,
  toSignature,
  verdict,
  type FeatureSignature,
  type OnBrandResult,
} from "@/lib/analysis/on-brand";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function readImage(file: File): Promise<{ sig: FeatureSignature; thumb: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no context"));
      ctx.drawImage(img, 0, 0, w, h);
      let sig: FeatureSignature;
      try {
        sig = toSignature(computeImageFeatures(ctx.getImageData(0, 0, w, h).data, w, h, img.width / img.height));
      } catch (e) {
        return reject(e as Error);
      }
      const t = document.createElement("canvas");
      t.width = 96;
      t.height = 96;
      const tctx = t.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      tctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96);
      resolve({ sig, thumb: t.toDataURL("image/jpeg", 0.7) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "var(--color-accent)";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export default function BrandChecker() {
  const { styleDNA } = useAppStore();
  const [result, setResult] = useState<{ res: OnBrandResult; thumb: string; name: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const check = useCallback(
    async (file: File) => {
      const dna = useAppStore.getState().styleDNA;
      if (!dna?.features) return;
      if (!ACCEPTED.includes(file.type)) {
        setError("Use a JPG, PNG, WebP or GIF.");
        return;
      }
      setChecking(true);
      setError(null);
      try {
        const { sig, thumb } = await readImage(file);
        setResult({ res: onBrandScore(dna.features, sig), thumb, name: file.name });
      } catch {
        setError("Couldn't read that image.");
      }
      setChecking(false);
    },
    []
  );

  const pick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED.join(",");
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) check(f);
    };
    input.click();
  }, [check]);

  // Needs a brand signature to compare against.
  if (!styleDNA?.features) return null;

  return (
    <motion.div
      initial={false}
      className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight">On-Brand Checker</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Drop any image — see how on-brand it is against your DNA, and why.
        </p>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.thumb}
              alt={result.name}
              className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-bold tabular-nums leading-none"
                  style={{ color: scoreColor(result.res.score) }}
                >
                  {result.res.score}
                </span>
                <span className="text-sm text-zinc-500">/ 100</span>
                <span
                  className="text-sm font-semibold ml-1"
                  style={{ color: scoreColor(result.res.score) }}
                >
                  {verdict(result.res.score)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.res.score}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: scoreColor(result.res.score) }}
                />
              </div>
            </div>
          </div>

          {result.res.reasons.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
                Off because
              </h3>
              <ul className="space-y-1">
                {result.res.reasons.map((r) => (
                  <li key={r} className="text-sm text-zinc-600 dark:text-zinc-300 flex gap-2">
                    <span className="text-red-500" aria-hidden="true">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.res.matches.length > 0 && (
            <p className="text-[13px] text-zinc-500">
              <span className="text-[#16a34a]">On point:</span>{" "}
              {result.res.matches.join(", ")}.
            </p>
          )}

          <button
            onClick={() => setResult(null)}
            className="text-sm font-medium px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors active:scale-[0.98]"
          >
            Check another
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Check an image against your DNA"
          aria-busy={checking}
          onClick={pick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pick();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) check(f);
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-[var(--color-accent)] bg-orange-50 dark:bg-orange-950/20"
              : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
          }`}
        >
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {checking ? "Reading the image…" : "Drop an image to check"}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            e.g. an AI-generated piece — is it still you?
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </motion.div>
  );
}
