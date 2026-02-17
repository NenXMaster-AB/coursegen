"use client";
import { useEffect, useState, useCallback } from "react";
import type { Chapter } from "@/lib/types";
import { getChapters } from "@/lib/api";

export function useChapters(bookId: number | null) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!bookId) {
        setChapters([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getChapters(bookId, signal);
        setChapters(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load chapters");
      } finally {
        setLoading(false);
      }
    },
    [bookId],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetch(ac.signal);
    return () => ac.abort();
  }, [fetch]);

  return { chapters, loading, error };
}
