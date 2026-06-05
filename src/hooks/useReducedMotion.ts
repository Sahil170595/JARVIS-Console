"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe `prefers-reduced-motion` hook (P117). Starts `true` (motion off) so
 * the server render + first paint never animate, then syncs to the OS setting on
 * mount and live-updates on change. Components gate framer-motion / `animate-*`
 * on this so motion-sensitive users aren't subjected to transitions.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
