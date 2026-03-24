"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionBadge() {
  const { connected, wsConnected } = useJarvis();

  const color = connected && wsConnected
    ? "bg-success"
    : connected
      ? "bg-warning"
      : "bg-destructive";

  const label = connected && wsConnected
    ? "Connected"
    : connected
      ? "HTTP only"
      : "Disconnected";

  const Icon = connected ? Wifi : WifiOff;

  return (
    <div className="flex flex-col items-center gap-1" title={label}>
      <Icon size={16} className={connected ? "text-success" : "text-destructive"} />
      <div className={`w-2 h-2 rounded-full ${color} ${!connected ? "animate-pulse-slow" : ""}`} />
    </div>
  );
}
