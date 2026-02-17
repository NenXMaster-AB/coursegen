"use client";

import { motion } from "motion/react";

interface QuizResultsProps {
  correct: number;
  total: number;
  onRetry: () => void;
}

export function QuizResults({ correct, total, onRetry }: QuizResultsProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-8 space-y-6"
    >
      {/* Circular progress */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-elevated)"
            strokeWidth="6"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={pct >= 70 ? "var(--color-success)" : pct >= 40 ? "var(--color-gold)" : "var(--color-error)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-display font-bold text-text-primary"
          >
            {pct}%
          </motion.span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="font-display text-xl font-semibold">
          {pct >= 80
            ? "Excellent!"
            : pct >= 60
              ? "Good job!"
              : pct >= 40
                ? "Keep going!"
                : "Review needed"}
        </h3>
        <p className="text-sm text-text-secondary">
          {correct} of {total} correct
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-lg border border-gold/30 text-sm text-gold hover:bg-gold/10 transition-colors"
      >
        Try Again
      </button>
    </motion.div>
  );
}
