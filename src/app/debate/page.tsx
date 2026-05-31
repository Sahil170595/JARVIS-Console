"use client";

/**
 * P109.1 — Debate list + launch view.
 *
 * Replaces the start-debate UI of the retired Tauri chimera/ui/ app. Hits
 * chimera-backend (CHIMERA_URL, default :8100) directly — chimera has
 * permissive CORS. Real-time live viewing happens on /debate/[id].
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import {
  DebateSummary,
  listCompletedDebates,
  startDebate,
} from "@/lib/chimera-client";
import { useToast } from "@/components/shared/Toast";
import { useChimeraHealth, ChimeraHealth } from "@/hooks/useChimeraHealth";

const AVAILABLE_MODELS = ["openai", "anthropic", "google", "ollama_local"];

function HealthDot({ status }: { status: ChimeraHealth }) {
  const color =
    status === "healthy"
      ? "text-emerald-400"
      : status === "unreachable"
      ? "text-rose-400"
      : "text-muted-foreground";
  return (
    <span
      title={`chimera-backend: ${status}`}
      className={`inline-flex items-center gap-1 text-xs ${color}`}
    >
      <CircleDot
        className={`w-3 h-3 ${status === "healthy" ? "animate-pulse" : ""}`}
      />
      chimera {status}
    </span>
  );
}

export default function DebateListPage() {
  const router = useRouter();
  const { info: toastInfo, error: toastError } = useToast();
  const health = useChimeraHealth();
  const [debates, setDebates] = useState<DebateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState(
    "Should I upload sensitive client data to a public cloud bucket?"
  );
  const [localResponse, setLocalResponse] = useState(
    "Sure, public buckets are fast and convenient for sharing."
  );
  const [maxRounds, setMaxRounds] = useState(3);
  const [budgetLimit, setBudgetLimit] = useState(0.5);

  // P109.3: Advanced Settings — temperature + thinking + selected_models.
  // All optional; chimera DebateStartRequest accepts each.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [thinking, setThinking] = useState(false);
  // P109.3: default to NO selected_models so chimera uses its own default
  // routing (which is ollama_local in the local-only stack). Hard-coding
  // ["openai","google"] previously forced the debate into the "degraded"
  // fallback path on deployments without those API keys — silent UX bug.
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const toggleModel = useCallback((m: string) => {
    setSelectedModels((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listCompletedDebates();
      setDebates(list);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStart = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const { debate_id } = await startDebate({
        query,
        local_response: localResponse,
        max_rounds: maxRounds,
        budget_limit: budgetLimit,
        // P109.3 advanced settings — all optional in chimera schema
        temperature,
        thinking,
        selected_models: selectedModels.length > 0 ? selectedModels : undefined,
      });
      toastInfo(`Debate ${debate_id.slice(0, 16)}… started`);
      router.push(
        `/debate/${encodeURIComponent(debate_id)}?q=${encodeURIComponent(query)}&r=${maxRounds}`
      );
    } catch (err) {
      const msg = String(err);
      setError(msg);
      toastError(`Failed to start: ${msg.slice(0, 120)}`);
    } finally {
      setStarting(false);
    }
  }, [
    query,
    localResponse,
    maxRounds,
    budgetLimit,
    temperature,
    thinking,
    selectedModels,
    router,
    toastInfo,
    toastError,
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Debate</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live multi-LLM constitutional debate viewer. Streams rounds from
            chimera-backend.
          </p>
        </div>
        <HealthDot status={health} />
      </header>

      <section className="border border-border rounded-xl p-5 bg-card space-y-3">
        <h2 className="font-semibold">Start a new debate</h2>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Local (non-debate) response — what chimera should improve on
          </label>
          <textarea
            value={localResponse}
            onChange={(e) => setLocalResponse(e.target.value)}
            rows={2}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex gap-3">
          <label className="text-xs text-muted-foreground flex flex-col flex-1">
            Max rounds
            <input
              type="number"
              min={1}
              max={7}
              value={maxRounds}
              onChange={(e) => setMaxRounds(Number(e.target.value))}
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono mt-1"
            />
          </label>
          <label className="text-xs text-muted-foreground flex flex-col flex-1">
            Budget limit (USD)
            <input
              type="number"
              step={0.1}
              min={0.1}
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono mt-1"
            />
          </label>
        </div>

        {/* P109.3: Advanced Settings collapsible — temperature + thinking +
            selected_models. All optional; chimera DebateStartRequest accepts
            each. */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          Advanced settings
        </button>

        {showAdvanced && (
          <div className="space-y-3 border-l-2 border-border pl-3 ml-1">
            <div>
              <label className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Temperature</span>
                <span className="font-mono">{temperature.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full mt-1 accent-primary"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={thinking}
                onChange={(e) => setThinking(e.target.checked)}
                className="accent-primary"
              />
              Enable thinking (verbose reasoning trace)
            </label>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Models ({selectedModels.length} selected — leave empty for chimera default)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_MODELS.map((m) => {
                  const active = selectedModels.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleModel(m)}
                      className={`text-xs px-2 py-1 rounded border font-mono ${
                        active
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={starting || !query.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Starting…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Start debate
            </>
          )}
        </button>

        {error && (
          <p className="text-xs text-rose-400 font-mono break-all">{error}</p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Completed debates</h2>
          <button
            onClick={refresh}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {debates.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {loading
              ? "Loading…"
              : "No completed debates yet. Start one above."}
          </p>
        ) : (
          <ul className="space-y-1">
            {debates.map((d) => (
              <li key={d.debate_id}>
                <button
                  onClick={() =>
                    router.push(
                      `/debate/${encodeURIComponent(d.debate_id)}?q=${encodeURIComponent(d.query)}`
                    )
                  }
                  className="w-full text-left border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {d.debate_id.slice(0, 12)}…
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-sm truncate">{d.query}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                    <span>{d.state ?? "completed"}</span>
                    {typeof d.consensus_score === "number" && (
                      <span>consensus {d.consensus_score.toFixed(3)}</span>
                    )}
                    {typeof d.total_cost === "number" && (
                      <span>${d.total_cost.toFixed(4)}</span>
                    )}
                    {d.completed_at && (
                      <span>{new Date(d.completed_at).toLocaleString()}</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
