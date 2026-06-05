"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Spinner } from "@/components/shared/Spinner";
import type { MemoryResponse } from "@/lib/types";
import { Brain, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

export default function MemoryPage() {
  const { client } = useJarvis();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<"memories" | "facts">("memories");

  const { data, loading, refresh } = usePolling<MemoryResponse>(
    () => client!.getMemory(),
    0
  );

  const handleDeleteMemory = useCallback(
    async (id: string) => {
      if (!client) return;
      await client.deleteMemory(id);
      refresh();
    },
    [client, refresh]
  );

  const handleDeleteFact = useCallback(
    async (id: string) => {
      if (!client) return;
      await client.deleteFact(id);
      refresh();
    },
    [client, refresh]
  );

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <Brain size={20} className="text-primary" aria-hidden="true" /> Memory
      </h1>
      <DisconnectedBanner />

      <div role="tablist" aria-label="Memory sections" className="flex gap-2 mb-4">
        {(["memories", "facts"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            id={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              tab === t
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "memories" ? "Memories" : "Facts"}{" "}
            {data && (
              <span className="text-xs opacity-60">
                ({t === "memories" ? data.memories.length : data.facts.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div aria-live="polite">
          <Spinner />
        </div>
      ) : tab === "memories" ? (
        <div
          id="panel-memories"
          role="tabpanel"
          aria-labelledby="tab-memories"
          aria-live="polite"
          className="space-y-2"
        >
          <ul role="list" className="space-y-2">
            {(data?.memories || []).map((m) => (
              <li
                key={m.memory_id}
                className={`bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3${reducedMotion ? "" : " animate-fade-in"}`}
              >
                <div className="flex-1">
                  <p className="text-sm">{m.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMemory(m.memory_id)}
                  aria-label="Delete memory"
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!data?.memories.length && (
            <p role="status" className="text-sm text-muted-foreground">No memories stored.</p>
          )}
        </div>
      ) : (
        <div
          id="panel-facts"
          role="tabpanel"
          aria-labelledby="tab-facts"
          aria-live="polite"
          className="space-y-2"
        >
          <ul role="list" className="space-y-2">
            {(data?.facts || []).map((f) => (
              <li
                key={f.fact_id}
                className={`bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3${reducedMotion ? "" : " animate-fade-in"}`}
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary">
                    {f.fact_key}
                  </span>
                  <span className="text-sm text-muted-foreground"> = </span>
                  <span className="text-sm">{f.fact_value}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {new Date(f.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteFact(f.fact_id)}
                  aria-label="Delete fact"
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!data?.facts.length && (
            <p role="status" className="text-sm text-muted-foreground">No facts stored.</p>
          )}
        </div>
      )}
    </div>
  );
}
