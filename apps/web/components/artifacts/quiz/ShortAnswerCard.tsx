"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye } from "lucide-react";
import type { ShortAnswerQuestion } from "@/lib/types";

interface ShortAnswerCardProps {
  question: ShortAnswerQuestion;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

export function ShortAnswerCard({
  question,
  onAnswer,
  disabled,
}: ShortAnswerCardProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    // Self-assessed - mark as correct by default
    onAnswer(true);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-text-primary leading-relaxed">
        {question.question}
      </h3>

      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={revealed || disabled}
        placeholder="Type your answer..."
        rows={3}
        className="w-full rounded-lg border border-border-subtle bg-surface p-3 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
      />

      {!revealed && (
        <button
          onClick={handleReveal}
          className="flex items-center gap-2 text-sm text-gold hover:text-gold-warm transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Reveal Answer
        </button>
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
              <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">
                Model Answer
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                {question.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
