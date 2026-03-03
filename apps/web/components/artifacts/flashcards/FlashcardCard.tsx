"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Flashcard } from "@/lib/types";

interface FlashcardCardProps {
  card: Flashcard;
  index: number;
  onClick?: () => void;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
  medium: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  hard: "bg-red-400/15 text-red-400 border-red-400/30",
};

export function FlashcardCard({ card, index, onClick }: FlashcardCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setFlipped(!flipped);
    }
  };

  return (
    <div
      className="relative h-48 cursor-pointer"
      style={{ perspective: 800 }}
      onClick={handleClick}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border border-border-subtle bg-surface p-4 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-text-tertiary">#{index + 1}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${difficultyColors[card.difficulty] || difficultyColors.medium}`}>
              {card.difficulty}
            </span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed flex-1 line-clamp-4">
            {card.front}
          </p>
          {card.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {card.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-elevated text-text-tertiary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border border-gold/20 bg-gold/5 p-4 flex flex-col justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
            {card.back}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
