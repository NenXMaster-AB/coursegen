"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Job } from "@/lib/types";
import { getJob } from "@/lib/api";

export function useJob(
  jobId: string | null,
  onComplete?: () => void,
) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    setJob(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    setError(null);
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const data = await getJob(jobId!);
        if (cancelled) return;
        setJob(data);
        if (data.status === "finished" || data.status === "failed") {
          onCompleteRef.current?.();
          return;
        }
        timer = setTimeout(poll, 1200);
      } catch {
        if (cancelled) return;
        timer = setTimeout(poll, 2000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  return { job, error, clear };
}
