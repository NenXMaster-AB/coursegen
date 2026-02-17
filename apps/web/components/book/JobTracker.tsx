"use client";

import { motion } from "motion/react";
import { AnimatedProgress } from "@/components/shared/AnimatedProgress";
import { Check, Loader2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

interface JobTrackerProps {
  job: Job;
}

const stages = [
  { key: "queued", label: "Queued", minProgress: 0 },
  { key: "started", label: "Processing", minProgress: 1 },
  { key: "generating", label: "Generating", minProgress: 30 },
  { key: "finished", label: "Done", minProgress: 100 },
] as const;

function getActiveStage(job: Job): number {
  if (job.status === "finished") return 3;
  if (job.status === "failed") return -1;
  if (job.progress >= 30) return 2;
  if (job.status === "started") return 1;
  return 0;
}

export function JobTracker({ job }: JobTrackerProps) {
  const activeStage = getActiveStage(job);
  const isFailed = job.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-subtle bg-card p-5 space-y-4"
    >
      {/* Pipeline stages */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isDone = i < activeStage || (activeStage === 3 && i === 3);
          const isActive = i === activeStage && !isFailed;
          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                    isDone && "bg-gold text-void",
                    isActive && "bg-gold/20 border border-gold",
                    !isDone && !isActive && "bg-elevated border border-border-subtle",
                  )}
                >
                  {isDone ? (
                    <Check className="w-3 h-3" />
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 text-gold animate-spin" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 text-text-tertiary" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap",
                    isDone && "text-gold",
                    isActive && "text-text-primary font-medium",
                    !isDone && !isActive && "text-text-tertiary",
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-2",
                    i < activeStage ? "bg-gold" : "bg-border-subtle",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <AnimatedProgress value={job.progress} />

      {/* Message */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {isFailed ? (
            <span className="flex items-center gap-1.5 text-error">
              <AlertCircle className="w-3.5 h-3.5" />
              {job.message || "Generation failed"}
            </span>
          ) : (
            job.message || "Waiting..."
          )}
        </span>
        <span className="text-xs text-text-tertiary font-mono">{job.progress}%</span>
      </div>
    </motion.div>
  );
}
