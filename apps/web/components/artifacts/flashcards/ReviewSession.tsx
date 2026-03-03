"use client";

import { useReducer, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitFlashcardReview } from "@/lib/api";
import type { Flashcard, FlashcardReviewState } from "@/lib/types";

interface ReviewSessionProps {
  artifactId: number;
  cards: Flashcard[];
  dueIndices: number[];
  onComplete: () => void;
}

interface State {
  position: number;
  flipped: boolean;
  ratings: number[];
  finished: boolean;
}

type Action =
  | { type: "flip" }
  | { type: "rate"; quality: number }
  | { type: "reset"; total: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "flip":
      return { ...state, flipped: true };
    case "rate": {
      const ratings = [...state.ratings, action.quality];
      const next = state.position + 1;
      if (next >= state.ratings.length + 1 && ratings.length >= state.position + 1) {
        // Check if this was the last card
        return { ...state, ratings, position: next, flipped: false, finished: next >= ratings.length || false };
      }
      return { ...state, ratings, position: next, flipped: false };
    }
    case "reset":
      return { position: 0, flipped: false, ratings: [], finished: false };
  }
}

const ratingButtons = [
  { quality: 0, label: "Again", color: "bg-red-500/15 text-red-400 hover:bg-red-500/25 border-red-500/30" },
  { quality: 2, label: "Hard", color: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/30" },
  { quality: 3, label: "Good", color: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30" },
  { quality: 5, label: "Easy", color: "bg-gold/15 text-gold hover:bg-gold/25 border-gold/30" },
];

export function ReviewSession({ artifactId, cards, dueIndices, onComplete }: ReviewSessionProps) {
  const [state, dispatch] = useReducer(reducer, {
    position: 0,
    flipped: false,
    ratings: [],
    finished: false,
  });

  const totalDue = dueIndices.length;

  const handleRate = useCallback(
    (quality: number) => {
      const cardIndex = dueIndices[state.position];
      // Fire-and-forget API call
      submitFlashcardReview(artifactId, cardIndex, quality).catch(() => {});

      if (state.position + 1 >= totalDue) {
        dispatch({ type: "rate", quality });
        // Session complete after a brief moment
      } else {
        dispatch({ type: "rate", quality });
      }
    },
    [artifactId, dueIndices, state.position, totalDue],
  );

  // Session complete
  if (state.position >= totalDue) {
    const again = state.ratings.filter((r) => r === 0).length;
    const hard = state.ratings.filter((r) => r === 2).length;
    const good = state.ratings.filter((r) => r === 3).length;
    const easy = state.ratings.filter((r) => r === 5).length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-border-subtle bg-card p-8 text-center space-y-6"
      >
        <h3 className="text-lg font-semibold text-text-primary">Session Complete</h3>
        <p className="text-sm text-text-secondary">
          You reviewed {totalDue} card{totalDue !== 1 ? "s" : ""}.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          {again > 0 && <span className="text-red-400">Again: {again}</span>}
          {hard > 0 && <span className="text-amber-400">Hard: {hard}</span>}
          {good > 0 && <span className="text-emerald-400">Good: {good}</span>}
          {easy > 0 && <span className="text-gold">Easy: {easy}</span>}
        </div>
        <Button onClick={onComplete} size="sm" className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Back to Deck
        </Button>
      </motion.div>
    );
  }

  const cardIndex = dueIndices[state.position];
  const card = cards[cardIndex];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary font-mono">
          Card {state.position + 1} of {totalDue}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalDue }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < state.position
                  ? "bg-gold"
                  : i === state.position
                    ? "bg-gold/60"
                    : "bg-elevated"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.position}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="rounded-xl border border-border-subtle bg-card overflow-hidden cursor-pointer"
            onClick={() => !state.flipped && dispatch({ type: "flip" })}
          >
            {/* Front */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {card.tags?.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-elevated text-text-tertiary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${
                  card.difficulty === "easy"
                    ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/30"
                    : card.difficulty === "hard"
                      ? "bg-red-400/15 text-red-400 border-red-400/30"
                      : "bg-amber-400/15 text-amber-400 border-amber-400/30"
                }`}>
                  {card.difficulty}
                </span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{card.front}</p>
            </div>

            {/* Answer (revealed on flip) */}
            <AnimatePresence>
              {state.flipped && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 border-t border-border-subtle">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                      {card.back}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action area */}
      {!state.flipped ? (
        <div className="flex justify-center">
          <button
            onClick={() => dispatch({ type: "flip" })}
            className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-warm transition-colors"
          >
            Reveal Answer
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {ratingButtons.map(({ quality, label, color }) => (
            <button
              key={quality}
              onClick={() => handleRate(quality)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
