"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChapterNavItem } from "./ChapterNavItem";
import type { Chapter, ArtifactType } from "@/lib/types";

interface ChapterNavProps {
  chapters: Chapter[];
  bookId: number;
  activeIndex: number | null;
  chapterArtifacts?: Map<number, Set<ArtifactType>>;
}

export function ChapterNav({
  chapters,
  bookId,
  activeIndex,
  chapterArtifacts,
}: ChapterNavProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return chapters;
    const q = search.toLowerCase();
    return chapters.filter((c) => c.title.toLowerCase().includes(q));
  }, [chapters, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border-subtle">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chapters..."
            className="pl-8 h-8 text-sm bg-surface border-border-subtle"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.map((ch) => (
            <ChapterNavItem
              key={ch.id}
              chapter={ch}
              bookId={bookId}
              isActive={ch.index === activeIndex}
              artifactTypes={chapterArtifacts?.get(ch.id)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-8">
              No chapters found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
