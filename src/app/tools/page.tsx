"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Badge } from "@/components/shared/Badge";
import { Spinner } from "@/components/shared/Spinner";
import type { Tool } from "@/lib/types";
import { Wrench } from "lucide-react";

const RISK_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
};

export default function ToolsPage() {
  const { client } = useJarvis();

  const { data, loading } = usePolling<{ tools: Tool[] }>(
    () => client!.getTools(),
    0
  );

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <Wrench size={20} className="text-primary" /> Tool Catalog
      </h1>
      <DisconnectedBanner />

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.tools || []).map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-xl p-5 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-medium text-sm">{t.name}</span>
                <Badge
                  label={t.risk_tier}
                  variant={RISK_VARIANT[t.risk_tier] || "muted"}
                />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {t.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {t.required_scopes.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
