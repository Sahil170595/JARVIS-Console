"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Badge } from "@/components/shared/Badge";
import { Spinner } from "@/components/shared/Spinner";
import type {
  SystemStatus,
  CognitiveEloResponse,
  ControlRoomResponse,
  AuditEvent,
} from "@/lib/types";
import {
  Activity,
  CheckCircle,
  XCircle,
  Brain,
  Shield,
  ScrollText,
} from "lucide-react";

export default function ControlRoomPage() {
  const { client } = useJarvis();
  const reducedMotion = useReducedMotion();

  const status = usePolling<SystemStatus>(
    () => client!.getSystemStatus(),
    10_000
  );
  const elo = usePolling<CognitiveEloResponse>(
    () => client!.getCognitiveElo(),
    15_000
  );
  const control = usePolling<ControlRoomResponse>(
    () => client!.getControlRoom(),
    5_000
  );
  const audits = usePolling<{ audits: AuditEvent[] }>(
    () => client!.getAudits(20),
    10_000
  );

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <Activity size={20} className="text-primary" aria-hidden="true" /> Control Room
      </h1>

      <DisconnectedBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* System Health */}
        <section
          aria-labelledby="system-health-heading"
          aria-live="polite"
          aria-atomic="false"
          className={`bg-card border border-border rounded-xl p-5${reducedMotion ? "" : " animate-fade-in"}`}
        >
          <h2 id="system-health-heading" className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={14} aria-hidden="true" /> System Health
          </h2>
          {status.loading ? (
            <Spinner />
          ) : status.data ? (
            <div className="space-y-2">
              <ul className="space-y-2 list-none m-0 p-0">
                {Object.entries(status.data.dependencies).map(([name, dep]) => (
                  <li key={name} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{name}</span>
                    <div className="flex items-center gap-2">
                      {dep.circuit_state && (
                        <span className="text-xs text-muted-foreground">
                          {dep.circuit_state}
                        </span>
                      )}
                      <div
                        aria-label={dep.ok ? "healthy" : "unhealthy"}
                        className={`w-2 h-2 rounded-full ${
                          dep.ok ? "bg-success" : "bg-destructive"
                        }`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-border">
                <Badge
                  label={status.data.status}
                  variant={status.data.status === "healthy" ? "success" : "warning"}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unavailable</p>
          )}
        </section>

        {/* Cognitive ELO */}
        <section
          aria-labelledby="cognitive-agents-heading"
          aria-live="polite"
          aria-atomic="false"
          className={`bg-card border border-border rounded-xl p-5${reducedMotion ? "" : " animate-fade-in"}`}
        >
          <h2 id="cognitive-agents-heading" className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Brain size={14} aria-hidden="true" /> Cognitive Agents
          </h2>
          {elo.loading ? (
            <Spinner />
          ) : elo.data?.available ? (
            <ol className="space-y-2 list-none m-0 p-0">
              {elo.data.rankings.map((agent, i) => (
                <li key={agent.agent_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4" aria-label={`Rank ${i + 1}`}>
                      #{i + 1}
                    </span>
                    <span className="text-sm">{agent.style}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground" aria-label={`${agent.games_played} games played`}>
                      {agent.games_played}g
                    </span>
                    <span className="text-sm font-mono font-medium" aria-label={`ELO ${Math.round(agent.elo)}`}>
                      {Math.round(agent.elo)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              TDD005 cognitive layer unavailable
            </p>
          )}
        </section>

        {/* Pending Approvals */}
        <section
          aria-labelledby="pending-approvals-heading"
          aria-live="polite"
          aria-atomic="true"
          className={`bg-card border border-border rounded-xl p-5${reducedMotion ? "" : " animate-fade-in"}`}
        >
          <h2 id="pending-approvals-heading" className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Shield size={14} aria-hidden="true" /> Pending Approvals
          </h2>
          {control.loading ? (
            <Spinner />
          ) : control.data?.pending_approvals.length ? (
            <ul className="space-y-2 list-none m-0 p-0">
              {control.data.pending_approvals.map((a) => (
                <li
                  key={a.approval_id}
                  role="alert"
                  className="text-sm p-2 rounded-lg bg-warning/5 border border-warning/20"
                >
                  <span className="font-mono">{a.tool_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {a.risk_tier}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None pending</p>
          )}
        </section>

        {/* Audit Trail */}
        <section
          aria-labelledby="audit-trail-heading"
          aria-live="polite"
          aria-atomic="false"
          className={`bg-card border border-border rounded-xl p-5 lg:col-span-2 xl:col-span-3${reducedMotion ? "" : " animate-fade-in"}`}
        >
          <h2 id="audit-trail-heading" className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <ScrollText size={14} aria-hidden="true" /> Recent Audit Events
          </h2>
          {audits.loading ? (
            <Spinner />
          ) : audits.data?.audits.length ? (
            <ul className="space-y-1 max-h-64 overflow-y-auto list-none m-0 p-0" aria-label="Audit event list">
              {audits.data.audits.map((a) => (
                <li
                  key={a.audit_id}
                  className="flex items-center gap-3 text-xs py-1.5 border-b border-border/50"
                >
                  <span className="text-muted-foreground w-40 shrink-0 font-mono">
                    <time dateTime={a.created_at}>{new Date(a.created_at).toLocaleTimeString()}</time>
                  </span>
                  <Badge label={a.event_type} variant="muted" />
                  <span className="text-muted-foreground truncate">
                    {JSON.stringify(a.event_data).slice(0, 80)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No events</p>
          )}
        </section>
      </div>
    </div>
  );
}
