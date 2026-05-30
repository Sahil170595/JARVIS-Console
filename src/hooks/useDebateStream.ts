"use client";

/**
 * P109.1 — Subscribe to a chimera debate's SSE event stream.
 *
 * Chimera's SSE event taxonomy (verified live against chimera-backend
 * /api/v1/debate/{id}/stream against real LLM calls):
 *   debate_started    — { debate_id, status }
 *   setup_complete    — { task_type, heat_level, budget_allocated }
 *   round_start       — { round, round_type, heat_level, budget_remaining }
 *   model_response    — { round, round_type, model_id, response_text,
 *                         alignment_score, confidence?, cost, processing_time_ms }
 *   round_complete    — { round, round_type, consensus_score, disagreement,
 *                         heat_level, budget_used }
 *   consensus         — { consensus_method, consensus_score, confidence,
 *                         winner_model, final_response }
 *   debate_complete   — { state, consensus_score, confidence, total_cost, final_response }
 *   debate_failed     — terminal failure
 *   heartbeat         — keepalive (empty)
 *
 * The /api/v1/debate/{id}/status endpoint only returns a thin progress summary
 * (current_round/total_rounds/budget) and the /result endpoint only returns
 * per-round average_score (not per-model responses). The full per-model
 * response_text + alignment_score data is ONLY available via the SSE stream's
 * model_response events. So this hook accumulates state purely from SSE.
 *
 * The Tauri DebateViewer at chimera/ui/src/components/DebateViewer.tsx
 * subscribed to a different Tauri-bridged event channel ('debate-update')
 * and assumed `delta` token streaming, which chimera does NOT emit — that
 * was a Tauri-internal abstraction, not a chimera surface. P109.1 ports to
 * the real chimera SSE.
 */

import { useEffect, useRef, useState } from "react";
import {
  DebateState,
  DebateRound,
  ModelResponse,
  debateStreamUrl,
  getDebateStatus,
} from "@/lib/chimera-client";

export type StreamStatus = "idle" | "connecting" | "open" | "closed" | "error";

// ---------------------------------------------------------------------------
// Event payload shapes (subset of chimera SSE — only the fields we render)
// ---------------------------------------------------------------------------

interface SetupCompletePayload {
  task_type?: string;
  heat_level?: number;
  budget_allocated?: number;
}
interface RoundStartPayload {
  round: number;
  round_type?: string;
  heat_level?: number;
  budget_remaining?: number;
}
interface ModelResponsePayload {
  round: number;
  round_type?: string;
  model_id: string;
  response_text: string;
  alignment_score: number;
  confidence?: number;
  cost?: number;
  processing_time_ms?: number;
}
interface RoundCompletePayload {
  round: number;
  round_type?: string;
  consensus_score: number;
  disagreement?: number;
  heat_level?: number;
  budget_used?: number;
}
interface ConsensusPayload {
  consensus_method?: string;
  consensus_score: number;
  confidence?: number;
  winner_model?: string;
  final_response?: string;
}
interface TerminalPayload {
  state: string;
  consensus_score?: number;
  confidence?: number;
  total_cost?: number;
  final_response?: string;
}

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

function emptyState(debateId: string): DebateState {
  return {
    debate_id: debateId,
    query: "",
    state: "starting",
    current_round: 0,
    // P109.2: undefined (not 0) so the UI can render "?" until /status fetch
    // lands — chimera doesn't emit total_rounds in any SSE event.
    total_rounds: undefined,
    rounds: [],
    models_used: [],
    total_cost: 0,
    consensus_score: 0,
    confidence: 0,
  };
}

function ensureRound(rounds: DebateRound[], round_number: number, round_type?: string): DebateRound[] {
  if (rounds.find((r) => r.round_number === round_number)) return rounds;
  return [
    ...rounds,
    {
      round_number,
      round_type: round_type ?? "round",
      responses: [],
      timestamp: new Date().toISOString(),
    },
  ];
}

function applyRoundStart(prev: DebateState, evt: RoundStartPayload): DebateState {
  const rounds = ensureRound(prev.rounds, evt.round, evt.round_type);
  return {
    ...prev,
    rounds,
    current_round: Math.max(prev.current_round, evt.round),
  };
}

function applyModelResponse(prev: DebateState, evt: ModelResponsePayload): DebateState {
  const rounds = ensureRound(prev.rounds, evt.round, evt.round_type);
  const idx = rounds.findIndex((r) => r.round_number === evt.round);
  if (idx === -1) return prev;
  const target = rounds[idx];
  const existing = target.responses.findIndex((r) => r.model_id === evt.model_id);
  const newResp: ModelResponse = {
    model_id: evt.model_id,
    response_text: evt.response_text,
    alignment_score: evt.alignment_score,
    confidence: evt.confidence ?? 0,
    processing_time_ms: evt.processing_time_ms ?? 0,
    tokens_used: 0,
    cost: evt.cost ?? 0,
  };
  if (existing === -1) target.responses = [...target.responses, newResp];
  else target.responses[existing] = newResp;
  const models = prev.models_used.includes(evt.model_id)
    ? prev.models_used
    : [...prev.models_used, evt.model_id];
  return { ...prev, rounds: [...rounds], models_used: models };
}

function applyRoundComplete(prev: DebateState, evt: RoundCompletePayload): DebateState {
  const rounds = ensureRound(prev.rounds, evt.round, evt.round_type);
  const idx = rounds.findIndex((r) => r.round_number === evt.round);
  if (idx === -1) return prev;
  rounds[idx] = {
    ...rounds[idx],
    consensus_score: evt.consensus_score,
  };
  return { ...prev, rounds: [...rounds] };
}

function applyConsensus(prev: DebateState, evt: ConsensusPayload): DebateState {
  return {
    ...prev,
    consensus_score: evt.consensus_score,
    confidence: evt.confidence ?? prev.confidence,
    final_response: evt.final_response ?? prev.final_response,
  };
}

function applyTerminal(prev: DebateState, evt: TerminalPayload): DebateState {
  return {
    ...prev,
    state: evt.state,
    consensus_score: evt.consensus_score ?? prev.consensus_score,
    confidence: evt.confidence ?? prev.confidence,
    total_cost: evt.total_cost ?? prev.total_cost,
    final_response: evt.final_response ?? prev.final_response,
  };
}

function applySetup(prev: DebateState, evt: SetupCompletePayload): DebateState {
  // Setup carries task_type/heat_level/budget_allocated — we don't render
  // these directly, but stash them on the state for any future UI.
  return {
    ...prev,
    state: "running",
    // (No-op for renderer; kept for completeness.)
    ...{},
    ...(typeof evt.budget_allocated === "number" ? {} : {}),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseDebateStreamOptions {
  /** P109.2: deterministic seed for state.total_rounds — pass when known
   * upfront (e.g. from the form's max_rounds field) so the UI shows
   * "round X/N" without waiting on /status. Falls back to the /status
   * fetch on debate_started when absent. */
  initialTotalRounds?: number;
}

export function useDebateStream(
  debateId: string | null,
  options: UseDebateStreamOptions = {}
) {
  const { initialTotalRounds } = options;
  const [state, setState] = useState<DebateState | null>(null);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!debateId) return;
    const seed = emptyState(debateId);
    if (typeof initialTotalRounds === "number" && initialTotalRounds > 0) {
      seed.total_rounds = initialTotalRounds;
    }
    setState(seed);
    setStatus("connecting");
    setError(null);

    const es = new EventSource(debateStreamUrl(debateId));
    sourceRef.current = es;

    const parse = <T,>(e: MessageEvent): T | null => {
      try {
        return JSON.parse(e.data) as T;
      } catch (err) {
        console.warn("SSE parse failed:", err, e.data);
        return null;
      }
    };

    // P109.2: on debate_started, fire a one-shot /status fetch to populate
    // total_rounds (chimera doesn't emit it via SSE).
    const fetchTotalRounds = async () => {
      try {
        const status = await getDebateStatus(debateId);
        const tr = status.progress?.total_rounds;
        if (typeof tr === "number" && tr > 0) {
          setState((p) => (p ? { ...p, total_rounds: tr } : p));
        }
      } catch {
        // Non-fatal — UI just keeps showing "?" for total_rounds.
      }
    };

    es.addEventListener("debate_started", () => {
      setState((p) => (p ? { ...p, state: "started" } : p));
      fetchTotalRounds();
    });

    es.addEventListener("setup_complete", (e) => {
      const evt = parse<SetupCompletePayload>(e as MessageEvent);
      if (evt) setState((p) => (p ? applySetup(p, evt) : p));
    });

    es.addEventListener("round_start", (e) => {
      const evt = parse<RoundStartPayload>(e as MessageEvent);
      if (evt) setState((p) => (p ? applyRoundStart(p, evt) : p));
    });

    es.addEventListener("model_response", (e) => {
      const evt = parse<ModelResponsePayload>(e as MessageEvent);
      if (evt) setState((p) => (p ? applyModelResponse(p, evt) : p));
    });

    es.addEventListener("round_complete", (e) => {
      const evt = parse<RoundCompletePayload>(e as MessageEvent);
      if (evt) setState((p) => (p ? applyRoundComplete(p, evt) : p));
    });

    es.addEventListener("consensus", (e) => {
      const evt = parse<ConsensusPayload>(e as MessageEvent);
      if (evt) setState((p) => (p ? applyConsensus(p, evt) : p));
    });

    const onTerminal = (e: MessageEvent) => {
      const evt = parse<TerminalPayload>(e);
      if (evt) setState((p) => (p ? applyTerminal(p, evt) : p));
      es.close();
      setStatus("closed");
    };
    es.addEventListener("debate_complete", onTerminal as EventListener);
    es.addEventListener("debate_failed", onTerminal as EventListener);
    // P109.2: chimera also emits `debate_cancelled` (router.py:734, 1000)
    // when /cancel hits a running debate. Without this listener the UI
    // hangs in "live" state forever after a cancel.
    es.addEventListener("debate_cancelled", onTerminal as EventListener);

    es.addEventListener("heartbeat", () => {
      /* keepalive — no-op */
    });

    es.onopen = () => setStatus("open");
    es.onerror = () => {
      // EventSource fires onerror on transient disconnects (auto-reconnect
      // pending) AND on stream end. P109.2: distinguish via readyState —
      // CONNECTING means the browser is auto-retrying; don't surface as
      // a hard error. CLOSED means the stream is gone; fall back to
      // /status to reconcile final state.
      const rs = es.readyState;
      if (rs === EventSource.CONNECTING) {
        // transient — keep status as-is, don't paint a red banner
        return;
      }
      setStatus((s) => (s === "closed" ? s : "error"));
      setError("SSE connection closed (debate may have ended)");
      // Best-effort reconcile so the UI shows the real terminal state
      // even when we missed the terminal event.
      void (async () => {
        try {
          const status = await getDebateStatus(debateId);
          if (status.status) {
            setState((p) => (p ? { ...p, state: status.status } : p));
          }
        } catch {
          /* keep the error banner */
        }
      })();
    };

    return () => {
      es.close();
      sourceRef.current = null;
      setStatus("closed");
    };
  }, [debateId]);

  return { state, status, error };
}
