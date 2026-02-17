"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code, Eye, ListChecks } from "lucide-react";
import { CodeBlock } from "@/components/shared/CodeBlock";
import type { CodingQuestion } from "@/lib/types";

interface CodingChallengeProps {
  question: CodingQuestion;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

export function CodingChallenge({
  question,
  onAnswer,
  disabled,
}: CodingChallengeProps) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    onAnswer(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Code className="w-4 h-4 text-gold" />
        <span className="text-xs font-semibold text-gold uppercase tracking-wider">
          Coding Challenge
        </span>
      </div>

      <h3 className="text-base font-medium text-text-primary leading-relaxed">
        {question.prompt}
      </h3>

      {question.constraints?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Constraints
          </p>
          <ul className="space-y-1">
            {question.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-gold mt-1">-</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!revealed && !disabled && (
        <button
          onClick={handleReveal}
          className="flex items-center gap-2 text-sm text-gold hover:text-gold-warm transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Show Solution
        </button>
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden space-y-4"
          >
            {question.solution_outline?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="w-3.5 h-3.5 text-gold" />
                  <p className="text-xs font-semibold text-gold uppercase tracking-wider">
                    Solution Outline
                  </p>
                </div>
                <ol className="space-y-1 list-decimal list-inside">
                  {question.solution_outline.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {question.tests?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Test Cases
                </p>
                <CodeBlock
                  code={question.tests.join("\n")}
                  language="python"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
