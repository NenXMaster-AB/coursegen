"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { Chapter, ArtifactType } from "@/lib/types";

const artifactDots: { type: ArtifactType; color: string }[] = [
  { type: "summary", color: "bg-info" },
  { type: "quiz", color: "bg-gold" },
  { type: "lab", color: "bg-success" },
  { type: "takeaways", color: "bg-chart-4" },
];

interface ChapterNavItemProps {
  chapter: Chapter;
  bookId: number;
  isActive: boolean;
  artifactTypes?: Set<ArtifactType>;
}

export function ChapterNavItem({
  chapter,
  bookId,
  isActive,
  artifactTypes,
}: ChapterNavItemProps) {
  return (
    <Link
      href={`/books/${bookId}/chapters/${chapter.index}`}
      className={cn(
        "block px-4 py-3 rounded-lg border-l-2 transition-all",
        isActive
          ? "border-l-gold bg-gold-glow text-text-primary"
          : "border-l-transparent hover:bg-elevated/50 text-text-secondary hover:text-text-primary",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-mono text-text-tertiary">
              {String(chapter.index).padStart(2, "0")}
            </span>
            <span className="text-sm font-medium truncate">
              {chapter.title}
            </span>
          </div>
          <span className="text-xs text-text-tertiary">
            {formatNumber(chapter.word_count)} words
          </span>
        </div>

        {artifactTypes && artifactTypes.size > 0 && (
          <div className="flex gap-1 mt-1.5 shrink-0">
            {artifactDots.map(
              (d) =>
                artifactTypes.has(d.type) && (
                  <div
                    key={d.type}
                    className={cn("w-1.5 h-1.5 rounded-full", d.color)}
                    title={d.type}
                  />
                ),
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
