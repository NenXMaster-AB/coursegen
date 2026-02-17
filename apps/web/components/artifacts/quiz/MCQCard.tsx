"use client";

import { useState } from "react";
import { motion, AnimatePresence, useAnimate } from "motion/react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MCQuestion } from "@/lib/types";

interface MCQCardProps {
  question: MCQuestion;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

export function MCQCard({ question, onAnswer, disabled }: MCQCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (revealed || disabled) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || revealed) return;
    setRevealed(true);
    const correct = selected === question.answer_index;
    if (!correct) setWrongIndex(selected);
    onAnswer(correct);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-text-primary leading-relaxed">
        {question.question}
      </h3>

      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const isCorrect = idx === question.answer_index;
          const isSelected = idx === selected;
          const isWrong = revealed && isSelected && !isCorrect;
          const isRight = revealed && isCorrect;

          return (
            <motion.button
              key={idx}
              animate={
                isWrong ? { x: [-8, 8, -4, 4, 0] } : undefined
              }
              whileTap={!revealed ? { scale: 0.98 } : undefined}
              onClick={() => handleSelect(idx)}
              disabled={revealed || disabled}
              className={cn(
                "w-full text-left rounded-lg border p-4 flex items-center gap-3 transition-all",
                !revealed && !isSelected && "border-border-subtle bg-surface hover:border-border-default hover:bg-elevated/50",
                !revealed && isSelected && "border-gold bg-gold/10",
                isRight && "border-success bg-success/10",
                isWrong && "border-error bg-error/10",
                (revealed || disabled) && "cursor-default",
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold",
                  !revealed && !isSelected && "bg-elevated text-text-tertiary",
                  !revealed && isSelected && "bg-gold text-void",
                  isRight && "bg-success text-void",
                  isWrong && "bg-error text-void",
                )}
              >
                {isRight ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isWrong ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isRight && "text-success font-medium",
                  isWrong && "text-error",
                  !isRight && !isWrong && "text-text-primary",
                )}
              >
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {!revealed && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={selected === null}
          className={cn(
            "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
            selected !== null
              ? "bg-gold text-void hover:bg-gold-warm"
              : "bg-elevated text-text-tertiary cursor-not-allowed",
          )}
        >
          Check Answer
        </motion.button>
      )}

      <AnimatePresence>
        {revealed && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border-subtle bg-surface p-4 mt-2">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                Explanation
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
