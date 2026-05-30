"use client";

/**
 * P109.1 — Typed wrapper around the chimera-backend debate API.
 *
 * Mirrors the shapes the Tauri DebateViewer used (ModelResponse, DebateRound,
 * DebateState) so the React UI port at jarvis-console/src/app/debate/ doesn't
 * have to invent new field names.
 *
 * All endpoints live on chimera-backend (CHIMERA_URL, default :8100). chimera
 * has permissive CORS so EventSource works directly from the browser.
 */

import { CHIMERA_URL } from "./constants";

// ---------------------------------------------------------------------------
// Data shapes (ported verbatim from chimera/ui/.../DebateViewer.tsx)
// ---------------------------------------------------------------------------

export interface ModelResponse {
  model_id: string;
  response_text: string;
  alignment_score: number;
  confidence: number;
  processing_time_ms: number;
  tokens_used: number;
  cost: number;
}

export interface DebateRound {
  round_number: number;
  round_type: string;
  responses: ModelResponse[];
  consensus_score?: number;
  timestamp: string;
}

export interface DebateState {
  debate_id: string;
  query: string;
  local_response?: string;
  state: string; // "running" | "completed" | "failed" | "cancelled"
  current_round: number;
  total_rounds: number;
  rounds: DebateRound[];
  models_used: string[];
  total_cost: number;
  consensus_score: number;
  confidence: number;
  final_response?: string;
  improvements_made?: string[];
  constitutional_violations?: string[];
}

/** Shape returned by GET /api/v1/debates/completed (verified live). */
export interface DebateSummary {
  debate_id: string;
  query: string;
  consensus_score?: number;
  confidence?: number;
  total_cost?: number;
  final_response?: string;
  completed_at?: string;
  consensus_hash?: string;
  // chimera doesn't currently return state on completed-list rows (all are
  // by definition completed); kept optional for future variants.
  state?: string;
  models_used?: string[];
  local_response?: string;
}

export interface StartDebateRequest {
  query: string;
  local_response: string;
  constitution_id?: string;
  selected_models?: string[];
  max_rounds?: number;
  budget_limit?: number;
  temperature?: number;
  thinking?: boolean;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function chimeraJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CHIMERA_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw new Error(`chimera ${path} -> ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as T;
}

export async function startDebate(req: StartDebateRequest): Promise<{ debate_id: string }> {
  return chimeraJson("/api/v1/debate/start", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getDebateStatus(debateId: string): Promise<DebateState> {
  return chimeraJson(`/api/v1/debate/${encodeURIComponent(debateId)}/status`);
}

export async function getDebateResult(debateId: string): Promise<DebateState> {
  return chimeraJson(`/api/v1/debate/${encodeURIComponent(debateId)}/result`);
}

export async function cancelDebate(debateId: string): Promise<void> {
  await chimeraJson(`/api/v1/debate/${encodeURIComponent(debateId)}/cancel`, {
    method: "POST",
  });
}

export async function listCompletedDebates(): Promise<DebateSummary[]> {
  try {
    const data = await chimeraJson<{ debates?: DebateSummary[] } | DebateSummary[]>(
      "/api/v1/debates/completed"
    );
    if (Array.isArray(data)) return data;
    return data.debates ?? [];
  } catch (err) {
    console.warn("listCompletedDebates failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// SSE stream URL (the hook handles EventSource lifecycle)
// ---------------------------------------------------------------------------

export function debateStreamUrl(debateId: string): string {
  return `${CHIMERA_URL}/api/v1/debate/${encodeURIComponent(debateId)}/stream`;
}
