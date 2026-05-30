"use client";

/**
 * P109.1 — Single round of a chimera multi-LLM debate.
 *
 * Renders per-model responses with alignment_score / confidence / cost / latency,
 * plus the round-level consensus_score when chimera has computed it.
 *
 * Visual style is intentionally minimal — feature parity with the Tauri
 * DebateViewer first, polish later (per user "decide on uiux polish later").
 */

import { DebateRound, ModelResponse } from "@/lib/chimera-client";
import { CheckCircle2, AlertCircle, Clock, DollarSign, Hash } from "lucide-react";

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function fmtCost(c: number): string {
  // P109.2: chimera reports 0.0 for local Ollama; rendering "$0.00m"
  // (millicents) looked broken. Treat exact zero as free and show "—".
  if (c === 0) return "—";
  if (c < 0.001) return `$${(c * 1000).toFixed(2)}m`;
  return `$${c.toFixed(4)}`;
}

function alignmentClass(score: number): string {
  if (score >= 0.85) return "text-emerald-400";
  if (score >= 0.65) return "text-amber-400";
  return "text-rose-400";
}

function ModelResponseRow({ resp }: { resp: ModelResponse }) {
  const passes = resp.alignment_score >= 0.65;
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {passes ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span className="font-mono text-sm">{resp.model_id}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span title="alignment score" className={alignmentClass(resp.alignment_score)}>
            align {resp.alignment_score.toFixed(3)}
          </span>
          <span title="confidence">conf {resp.confidence.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-sm text-foreground/90 whitespace-pre-wrap mb-2 max-h-40 overflow-y-auto">
        {resp.response_text || (
          <span className="text-muted-foreground italic">(streaming…)</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-1" title="latency">
          <Clock className="w-3 h-3" />
          {fmtMs(resp.processing_time_ms)}
        </span>
        <span className="flex items-center gap-1" title="tokens">
          <Hash className="w-3 h-3" />
          {resp.tokens_used.toLocaleString()}
        </span>
        <span className="flex items-center gap-1" title="cost">
          <DollarSign className="w-3 h-3" />
          {fmtCost(resp.cost)}
        </span>
      </div>
    </div>
  );
}

export function DebateRoundCard({ round }: { round: DebateRound }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          Round {round.round_number}
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            {round.round_type}
          </span>
        </h3>
        {typeof round.consensus_score === "number" && (
          <div className="text-sm font-mono">
            consensus{" "}
            <span className={alignmentClass(round.consensus_score)}>
              {round.consensus_score.toFixed(3)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {round.responses.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No responses yet…</p>
        ) : (
          round.responses.map((r) => (
            <ModelResponseRow key={`${round.round_number}-${r.model_id}`} resp={r} />
          ))
        )}
      </div>
    </div>
  );
}
