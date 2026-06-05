"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { WifiOff } from "lucide-react";

export function DisconnectedBanner() {
  const { connected } = useJarvis();

  if (connected) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-center gap-3 mb-4 animate-fade-in"
    >
      <WifiOff size={16} className="text-destructive shrink-0" aria-hidden="true" />
      <span className="text-sm text-destructive">
        JARVIS is unreachable. Data shown may be stale.
      </span>
    </div>
  );
}
