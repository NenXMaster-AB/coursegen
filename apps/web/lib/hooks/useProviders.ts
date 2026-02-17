"use client";
import { useEffect, useState } from "react";
import type { ProvidersResponse } from "@/lib/types";
import { getProviders } from "@/lib/api";

export function useProviders() {
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await getProviders(ac.signal);
        setData(res);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load providers");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  return { data, loading, error };
}
