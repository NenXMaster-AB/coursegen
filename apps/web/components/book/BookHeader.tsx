"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Book } from "@/lib/types";

interface BookHeaderProps {
  book: Book;
  chapterCount: number;
}

export function BookHeader({ book, chapterCount }: BookHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {book.title}
        </h1>
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider border-border-subtle text-text-tertiary"
        >
          {book.source_type}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-sm text-text-secondary">
        {book.author && <span>{book.author}</span>}
        {book.author && <span className="text-text-tertiary">·</span>}
        <span>{chapterCount} chapters</span>
        <span className="text-text-tertiary">·</span>
        <span>Added {formatDate(book.created_at)}</span>
      </div>
    </div>
  );
}
