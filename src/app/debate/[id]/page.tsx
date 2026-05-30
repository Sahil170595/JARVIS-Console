"use client";

/**
 * P109.1 — Live debate viewer.
 *
 * Subscribes to chimera's SSE stream at `/api/v1/debate/{id}/stream`. Renders
 * the same DebateRound visualization the Tauri DebateViewer did:
 * per-model alignment_score / confidence / cost / latency, per-round
 * consensus_score, terminal final_response.
 *
 * Polish deferred — the user asked for feature parity first.
 */

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  ArrowLeft,
  CircleDot,
  CheckCircle2,
  XCircle,
  Square,
} from "lucide-react";
import { useDebateStream, StreamStatus } from "@/hooks/useDebateStream";
import { DebateRoundCard } from "@/components/debate/DebateRoundCard";
import { cancelDebate } from "@/lib/chimera-client";

function StatusDot({ status, state }: { status: StreamStatus; state?: string }) {
  if (state === "completed")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" /> completed
      </span>
    );
  if (state === "failed" || state === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-400">
        <XCircle className="w-3.5 h-3.5" /> {state}
      </span>
    );
  if (status === "open")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <CircleDot className="w-3.5 h-3.5 animate-pulse" /> live
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-400">
        <XCircle className="w-3.5 h-3.5" /> error
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CircleDot className="w-3.5 h-3.5" /> {status}
    </span>
  );
}

export default function DebatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id ?? null;
  // Chimera's SSE events don't carry the original query text. Either the
  // caller passes ?q=... (from form/list) or we render "Loading…" until the
  // user clicks back to the list.
  const queryFromUrl = searchParams?.get("q") ?? "";
  const { state, status, error } = useDebateStream(id);

  const handleCancel = useCallback(async () => {
    if (!id) return;
    try {
      await cancelDebate(id);
    } catch (err) {
      console.warn("cancel failed:", err);
    }
  }, [id]);

  const stateLabel = state?.state ?? "loading";
  const terminal =
    state?.state === "completed" ||
    state?.state === "failed" ||
    state?.state === "cancelled";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.push("/debate")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          All debates
        </button>
        <StatusDot status={status} state={state?.state} />
      </header>

      {error && (
        <div className="border border-rose-500/40 bg-rose-500/10 rounded-lg p-3 text-sm text-rose-300 font-mono">
          {error}
        </div>
      )}

      <section className="border border-border rounded-xl p-5 bg-card">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-mono mb-1">
              {id}
            </p>
            <h1 className="font-semibold text-lg break-words">
              {queryFromUrl || state?.query || "Loading…"}
            </h1>
          </div>
          {!terminal && id && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded hover:border-rose-500/50 hover:text-rose-400"
            >
              <Square className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>

        {state?.local_response && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">
              Local (pre-debate) response
            </p>
            <p className="text-sm bg-background/50 border border-border rounded p-2 font-mono">
              {state.local_response}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <p className="text-muted-foreground">state</p>
            <p>{stateLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">round</p>
            <p>
              {state?.current_round ?? 0}/{state?.total_rounds ?? "?"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">consensus</p>
            <p>{state?.consensus_score?.toFixed(3) ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">total cost</p>
            <p>${state?.total_cost?.toFixed(4) ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {!state || state.rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Waiting for first round…
          </p>
        ) : (
          state.rounds.map((round) => (
            <DebateRoundCard
              key={round.round_number}
              round={round}
            />
          ))
        )}
      </section>

      {state?.final_response && (
        <section className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-5">
          <h2 className="font-semibold mb-2 text-emerald-300">Final response</h2>
          <p className="text-sm whitespace-pre-wrap">{state.final_response}</p>
        </section>
      )}

      {state?.constitutional_violations && state.constitutional_violations.length > 0 && (
        <section className="border border-rose-500/30 bg-rose-500/5 rounded-xl p-4">
          <h2 className="font-semibold mb-2 text-rose-300">
            Constitutional violations flagged
          </h2>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {state.constitutional_violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
