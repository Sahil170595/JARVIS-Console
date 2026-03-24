"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Spinner } from "@/components/shared/Spinner";
import type { MemoryResponse } from "@/lib/types";
import { Brain, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

export default function MemoryPage() {
  const { client } = useJarvis();
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
        <Brain size={20} className="text-primary" /> Memory
      </h1>
      <DisconnectedBanner />

      <div className="flex gap-2 mb-4">
        {(["memories", "facts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
        <Spinner />
      ) : tab === "memories" ? (
        <div className="space-y-2">
          {(data?.memories || []).map((m) => (
            <div
              key={m.memory_id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3 animate-fade-in"
            >
              <div className="flex-1">
                <p className="text-sm">{m.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDeleteMemory(m.memory_id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!data?.memories.length && (
            <p className="text-sm text-muted-foreground">No memories stored.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.facts || []).map((f) => (
            <div
              key={f.fact_id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3 animate-fade-in"
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
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!data?.facts.length && (
            <p className="text-sm text-muted-foreground">No facts stored.</p>
          )}
        </div>
      )}
    </div>
  );
}
