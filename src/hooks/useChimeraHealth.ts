"use client";

/**
 * P109.3 — Poll chimera /health every 30s.
 *
 * Returns one of "unknown" | "healthy" | "unreachable". The list view + viewer
 * render a tiny status dot so the user knows whether starting a debate will
 * succeed before they fill the form.
 *
 * Replaces the Tauri DebateViewer's checkHealth() + setInterval loop.
 */

import { useEffect, useState } from "react";
import { CHIMERA_URL } from "@/lib/constants";

export type ChimeraHealth = "unknown" | "healthy" | "unreachable";

const POLL_MS = 30_000;
const PROBE_TIMEOUT_MS = 4_000;

export function useChimeraHealth(): ChimeraHealth {
  const [status, setStatus] = useState<ChimeraHealth>("unknown");

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
        const res = await fetch(`${CHIMERA_URL}/health`, {
          signal: controller.signal,
        });
        clearTimeout(t);
        if (cancelled) return;
        setStatus(res.ok ? "healthy" : "unreachable");
      } catch {
        if (!cancelled) setStatus("unreachable");
      }
    };

    probe();
    const id = setInterval(probe, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return status;
}
