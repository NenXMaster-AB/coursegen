"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ImageIcon, ZoomIn } from "lucide-react";
import { API_BASE } from "@/lib/api";
import type { ChapterImage } from "@/lib/types";

interface ImageGalleryProps {
  images: ChapterImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selected, setSelected] = useState<ChapterImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-border-subtle bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-medium">
            Extracted Images
            <span className="text-text-tertiary ml-1.5 font-normal">
              ({images.length})
            </span>
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelected(img)}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border-subtle bg-surface hover:border-gold/40 transition-colors"
            >
              <img
                src={`${API_BASE}${img.url}`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative max-w-4xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={`${API_BASE}${selected.url}`}
                alt=""
                className="max-w-full max-h-[85vh] rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
