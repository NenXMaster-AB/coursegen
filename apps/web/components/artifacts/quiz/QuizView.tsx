"use client";

import { useReducer, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QuizProgress } from "./QuizProgress";
import { MCQCard } from "./MCQCard";
import { ShortAnswerCard } from "./ShortAnswerCard";
import { CodingChallenge } from "./CodingChallenge";
import { QuizResults } from "./QuizResults";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Artifact, QuizContent, MCQuestion, ShortAnswerQuestion, CodingQuestion } from "@/lib/types";

type QuestionItem =
  | { kind: "mcq"; data: MCQuestion }
  | { kind: "short_answer"; data: ShortAnswerQuestion }
  | { kind: "coding"; data: CodingQuestion };

interface State {
  current: number;
  answers: (boolean | null)[];
  finished: boolean;
}

type Action =
  | { type: "answer"; index: number; correct: boolean }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset"; total: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "answer": {
      const answers = [...state.answers];
      answers[action.index] = action.correct;
      return { ...state, answers };
    }
    case "next": {
      const next = state.current + 1;
      if (next >= state.answers.length) return { ...state, finished: true };
      return { ...state, current: next };
    }
    case "prev":
      return { ...state, current: Math.max(0, state.current - 1) };
    case "reset":
      return { current: 0, answers: Array(action.total).fill(null), finished: false };
  }
}

interface QuizViewProps {
  artifact: Artifact;
}

export function QuizView({ artifact }: QuizViewProps) {
  const content = artifact.content_json as QuizContent;

  const questions = useMemo<QuestionItem[]>(() => {
    const items: QuestionItem[] = [];
    content.mcq?.forEach((q) => items.push({ kind: "mcq", data: q }));
    content.short_answer?.forEach((q) => items.push({ kind: "short_answer", data: q }));
    content.coding?.forEach((q) => items.push({ kind: "coding", data: q }));
    return items;
  }, [content]);

  const [state, dispatch] = useReducer(reducer, {
    current: 0,
    answers: Array(questions.length).fill(null),
    finished: false,
  });

  const handleAnswer = useCallback(
    (correct: boolean) => {
      dispatch({ type: "answer", index: state.current, correct });
    },
    [state.current],
  );

  const handleRetry = useCallback(() => {
    dispatch({ type: "reset", total: questions.length });
  }, [questions.length]);

  if (questions.length === 0) {
    return (
      <div className="text-sm text-text-secondary">
        No quiz questions available.
      </div>
    );
  }

  if (state.finished) {
    const correctCount = state.answers.filter((a) => a === true).length;
    return (
      <QuizResults
        correct={correctCount}
        total={questions.length}
        onRetry={handleRetry}
      />
    );
  }

  const currentQ = questions[state.current];
  const answered = state.answers[state.current] !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary font-mono">
          Question {state.current + 1} of {questions.length}
        </span>
        <QuizProgress
          total={questions.length}
          current={state.current}
          answers={state.answers}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <div className="rounded-xl border border-border-subtle bg-card p-6">
            {currentQ.kind === "mcq" && (
              <MCQCard
                question={currentQ.data as MCQuestion}
                onAnswer={handleAnswer}
                disabled={answered}
              />
            )}
            {currentQ.kind === "short_answer" && (
              <ShortAnswerCard
                question={currentQ.data as ShortAnswerQuestion}
                onAnswer={handleAnswer}
                disabled={answered}
              />
            )}
            {currentQ.kind === "coding" && (
              <CodingChallenge
                question={currentQ.data as CodingQuestion}
                onAnswer={handleAnswer}
                disabled={answered}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => dispatch({ type: "prev" })}
          disabled={state.current === 0}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => dispatch({ type: "next" })}
          disabled={!answered}
          className="flex items-center gap-1 text-sm text-gold hover:text-gold-warm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {state.current === questions.length - 1 ? "Finish" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
