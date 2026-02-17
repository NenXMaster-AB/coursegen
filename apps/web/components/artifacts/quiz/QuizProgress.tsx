"use client";

import { cn } from "@/lib/utils";

interface QuizProgressProps {
  total: number;
  current: number;
  answers: (boolean | null)[];
}

export function QuizProgress({ total, current, answers }: QuizProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            i === current && "w-3 h-3 ring-2 ring-gold/40",
            answers[i] === true && "bg-success",
            answers[i] === false && "bg-error",
            answers[i] === null && i === current && "bg-gold",
            answers[i] === null && i !== current && "bg-elevated",
          )}
        />
      ))}
    </div>
  );
}
