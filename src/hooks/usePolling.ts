"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJarvis } from "./useJarvis";

export function usePolling<T>(
  fetcher: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>,
  intervalMs: number = 0
) {
  const { connected } = useJarvis();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    const res = await fetcherRef.current();
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!connected) {
      setLoading(false);
      return;
    }
    refresh();
    if (intervalMs > 0) {
      const timer = setInterval(refresh, intervalMs);
      return () => clearInterval(timer);
    }
  }, [connected, intervalMs, refresh]);

  return { data, error, loading, connected, refresh };
}
