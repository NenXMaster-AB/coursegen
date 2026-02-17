"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Target,
  ListChecks,
  BookOpen,
  Trophy,
  Rocket,
  Check,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact, LabContent } from "@/lib/types";

interface LabViewProps {
  artifact: Artifact;
}

export function LabView({ artifact }: LabViewProps) {
  const content = artifact.content_json as LabContent;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completedDeliverables, setCompletedDeliverables] = useState<Set<number>>(new Set());

  const toggleStep = useCallback((idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const toggleDeliverable = useCallback((idx: number) => {
    setCompletedDeliverables((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  if (!content || !content.objective) {
    return (
      <div className="text-sm text-text-secondary">
        Lab data is not available in structured format.
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Objective banner */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl border border-gold/20 bg-gold/5 p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">
            Objective
          </h3>
        </div>
        <p className="text-sm text-text-primary leading-relaxed">
          {content.objective}
        </p>
      </motion.div>

      {/* Prerequisites */}
      {content.prereqs?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-info" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Prerequisites
            </h3>
          </div>
          <ul className="space-y-1.5">
            {content.prereqs.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-info mt-0.5">-</span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Steps with vertical stepper */}
      {content.steps?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Steps
            </h3>
            <span className="text-xs text-text-tertiary ml-auto">
              {completedSteps.size}/{content.steps.length} completed
            </span>
          </div>

          <div className="space-y-1">
            {content.steps.map((step, i) => {
              const isDone = completedSteps.has(i);
              const isActive = i === currentStep;
              const isCodeBlock = step.startsWith("```");

              return (
                <div key={i} className="flex gap-3">
                  {/* Vertical stepper line + dot */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        toggleStep(i);
                        if (!isDone && i === currentStep && i < content.steps.length - 1) {
                          setCurrentStep(i + 1);
                        }
                      }}
                      className="shrink-0"
                    >
                      <motion.div
                        animate={isDone ? { scale: [1, 1.2, 1] } : {}}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                          isDone && "bg-success",
                          isActive && !isDone && "bg-gold/20 border-2 border-gold",
                          !isDone && !isActive && "bg-elevated border border-border-subtle",
                        )}
                      >
                        {isDone ? (
                          <Check className="w-3 h-3 text-void" />
                        ) : (
                          <Circle className="w-2 h-2 text-text-tertiary" />
                        )}
                      </motion.div>
                    </button>
                    {i < content.steps.length - 1 && (
                      <div
                        className={cn(
                          "w-px flex-1 min-h-4 my-1",
                          isDone ? "bg-success/40" : "bg-border-subtle",
                        )}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "flex-1 text-left rounded-lg p-3 mb-1 transition-all",
                      isActive
                        ? "bg-surface border border-border-default"
                        : "hover:bg-surface/50",
                      isDone && "opacity-70",
                    )}
                  >
                    {isCodeBlock ? (
                      <CodeBlock
                        code={step.replace(/^```\w*\n?/, "").replace(/\n?```$/, "")}
                      />
                    ) : (
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          isActive ? "text-text-primary" : "text-text-secondary",
                          isDone && "line-through",
                        )}
                      >
                        {step}
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Notebook cells */}
      {content.notebook_cells?.length > 0 && (
        <motion.div variants={staggerItem}>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Code Cells
          </h3>
          <div className="space-y-3">
            {content.notebook_cells.map((cell, i) => (
              <div key={i}>
                {cell.cell_type === "code" ? (
                  <CodeBlock code={cell.source} language="python" />
                ) : (
                  <div className="rounded-lg border border-border-subtle bg-surface p-4">
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                      {cell.source}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Deliverables */}
      {content.deliverables?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Deliverables
            </h3>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-2">
            {content.deliverables.map((d, i) => (
              <div key={i} className="flex items-start gap-3">
                <Checkbox
                  checked={completedDeliverables.has(i)}
                  onCheckedChange={() => toggleDeliverable(i)}
                  className="mt-0.5"
                />
                <span
                  className={cn(
                    "text-sm leading-relaxed",
                    completedDeliverables.has(i) ? "text-text-tertiary line-through" : "text-text-primary",
                  )}
                >
                  {d}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stretch goals */}
      {content.stretch_goals?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-info" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Stretch Goals
            </h3>
          </div>
          <ul className="space-y-1.5">
            {content.stretch_goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-info mt-0.5">-</span>
                {g}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Rubric */}
      {content.rubric?.length > 0 && (
        <motion.div variants={staggerItem}>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Rubric
          </h3>
          <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-2">
            {content.rubric.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-gold font-mono shrink-0">{i + 1}.</span>
                {r}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
