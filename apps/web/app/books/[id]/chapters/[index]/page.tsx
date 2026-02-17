"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GenerationPanel } from "@/components/book/GenerationPanel";
import { JobTracker } from "@/components/book/JobTracker";
import { ArtifactTabs } from "@/components/artifacts/ArtifactTabs";
import { useChapters } from "@/lib/hooks/useChapters";
import { useArtifacts } from "@/lib/hooks/useArtifacts";
import { useJob } from "@/lib/hooks/useJob";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function ChapterPage() {
  const params = useParams();
  const bookId = Number(params.id);
  const chapterIndex = Number(params.index);

  const { chapters, loading: chaptersLoading } = useChapters(bookId);
  const chapter = chapters.find((c) => c.index === chapterIndex);

  const { artifacts, loading: artifactsLoading, refetch: refetchArtifacts } = useArtifacts(chapter?.id ?? null);

  const [jobId, setJobId] = useState<string | null>(null);
  const onJobComplete = useCallback(() => {
    refetchArtifacts();
  }, [refetchArtifacts]);
  const { job } = useJob(jobId, onJobComplete);

  if (chaptersLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-24">
        <p className="text-text-secondary">Chapter not found</p>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* Chapter header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-text-tertiary font-mono mb-1">
          Chapter {String(chapterIndex).padStart(2, "0")}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {chapter.title}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {formatNumber(chapter.word_count)} words
        </p>
      </div>

      {/* Generation controls */}
      <GenerationPanel
        bookId={bookId}
        chapterIndex={chapterIndex}
        onJob={setJobId}
      />

      {/* Job tracker */}
      {job && (
        <div className="mt-4">
          <JobTracker job={job} />
        </div>
      )}

      <Separator className="my-6 bg-border-subtle" />

      {/* Artifacts */}
      {artifactsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      ) : (
        <ArtifactTabs artifacts={artifacts} />
      )}
    </PageTransition>
  );
}
