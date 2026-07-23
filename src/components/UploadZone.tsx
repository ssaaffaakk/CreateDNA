"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function UploadZone() {
  const {
    isAnalyzing,
    setAnalyzing,
    setStyleDNA,
    addImage,
    removeImage,
    styleDNA,
    images,
    error,
    setError,
  } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState("");
  const [lastFiles, setLastFiles] = useState<FileList | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type))
      return `${file.name}: unsupported format. Use JPG, PNG, WebP, or GIF.`;
    if (file.size > MAX_FILE_SIZE)
      return `${file.name}: too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`;
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles: File[] = [];
      for (const file of Array.from(files)) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          continue;
        }
        validFiles.push(file);
      }

      setLastFiles(files);

      for (const file of validFiles) {
        setAnalyzing(true);
        setError(null);
        setProgress(`Extracting DNA from ${file.name}...`);

        const base64 = await fileToBase64(file);
        const thumbnail = await createThumbnail(file);

        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              existingDNA: styleDNA,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(
              errData?.error || `Analysis failed (${res.status})`
            );
          }

          const data = await res.json();

          if (data.dna) {
            setStyleDNA(data.dna);
            addImage({
              id: crypto.randomUUID(),
              name: file.name,
              thumbnail,
              analyzedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Analysis failed unexpectedly"
          );
        }
      }
      setAnalyzing(false);
      setProgress("");
    },
    [styleDNA, setAnalyzing, setStyleDNA, addImage, setError]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${
          dragOver
            ? "border-[var(--color-accent)] bg-orange-50 dark:bg-orange-950/20 scale-[1.01]"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ACCEPTED_TYPES.join(",");
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFiles(files);
          };
          input.click();
        }}
      >
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4 py-2"
            >
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <div
                  className="absolute inset-2 border-2 border-[var(--color-accent-light)] border-b-transparent rounded-full animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
              </div>
              <p className="text-sm text-zinc-500 font-medium">{progress}</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 py-2"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-orange-50 dark:group-hover:bg-orange-950/30 transition-colors">
                <svg
                  className="w-7 h-7 text-zinc-400 group-hover:text-[var(--color-accent)] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
                  {images.length === 0
                    ? "Drop your creative work"
                    : "Add more work"}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  JPG, PNG, WebP, GIF up to 10MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
          >
            <span className="text-red-500 text-sm mt-0.5">!</span>
            <p className="text-sm text-red-600 dark:text-red-400 flex-1">
              {error}
            </p>
            <div className="flex gap-2">
              {lastFiles && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(null);
                    handleFiles(lastFiles);
                  }}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium"
                >
                  Retry
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                }}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative group/thumb"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbnail}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 text-[10px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
              >
                x
              </button>
            </motion.div>
          ))}
          <div className="w-16 h-16 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 text-xs">
            {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  });
}

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      ctx.drawImage(img, x, y, size, size, 0, 0, 128, 128);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}
