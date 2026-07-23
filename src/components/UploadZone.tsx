"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function UploadZone() {
  const { isAnalyzing, setAnalyzing, setStyleDNA, addImage, styleDNA, images } =
    useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        setAnalyzing(true);
        setProgress(`Analyzing ${file.name}...`);

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
          console.error("Analysis failed:", err);
        }
      }
      setAnalyzing(false);
      setProgress("");
    },
    [styleDNA, setAnalyzing, setStyleDNA, addImage]
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
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = "image/*";
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-zinc-500">{progress}</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-4xl">+</div>
              <p className="text-lg font-medium">Drop your work here</p>
              <p className="text-sm text-zinc-500">
                Upload portfolio pieces — each one teaches AI more about your style
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <motion.div
              key={img.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
            >
              <img
                src={img.thumbnail}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
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
