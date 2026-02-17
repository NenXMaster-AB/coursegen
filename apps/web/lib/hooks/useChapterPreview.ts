"use client";
import { useEffect, useState } from "react";
import type { ChapterPreview } from "@/lib/types";
import { getChapterPreview } from "@/lib/api";

export function useChapterPreview(chapterId: number | null) {
  const [preview, setPreview] = useState<ChapterPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapterId) {
      setPreview(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    getChapterPreview(chapterId, ac.signal)
      .then(setPreview)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [chapterId]);

  return { preview, loading };
}
