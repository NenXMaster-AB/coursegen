"use client";
import { useEffect, useState, useCallback } from "react";
import type { Artifact, ArtifactType } from "@/lib/types";
import { getArtifacts } from "@/lib/api";

export function useArtifacts(chapterId: number | null) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!chapterId) {
        setArtifacts([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getArtifacts(chapterId, signal);
        setArtifacts(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load artifacts");
      } finally {
        setLoading(false);
      }
    },
    [chapterId],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetch(ac.signal);
    return () => ac.abort();
  }, [fetch]);

  const refetch = useCallback(() => fetch(), [fetch]);

  const byType = useCallback(
    (type: ArtifactType): Artifact | undefined => {
      return artifacts
        .filter((a) => a.type === type)
        .sort((a, b) => b.version - a.version)[0];
    },
    [artifacts],
  );

  const availableTypes = artifacts.reduce<Set<ArtifactType>>((s, a) => {
    s.add(a.type);
    return s;
  }, new Set());

  return { artifacts, loading, error, refetch, byType, availableTypes };
}
