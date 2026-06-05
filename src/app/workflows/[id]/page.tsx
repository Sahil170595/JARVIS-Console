"use client";

import { useParams } from "next/navigation";
import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Badge } from "@/components/shared/Badge";
import { Spinner } from "@/components/shared/Spinner";
import type { WorkflowDetail } from "@/lib/types";
import { GitBranch, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WorkflowDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { client } = useJarvis();

  const { data, loading } = usePolling<WorkflowDetail>(
    () => client!.getWorkflow(id),
    5_000
  );

  return (
    <div>
      <Link
        href="/workflows"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to workflows
      </Link>

      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <GitBranch size={20} className="text-primary" aria-hidden="true" />
        {data?.workflow?.title || id.slice(0, 12)}
      </h1>
      <DisconnectedBanner />

      {loading ? (
        <Spinner />
      ) : data ? (
        <div className="space-y-6" aria-live="polite" aria-atomic="false">
          <section aria-labelledby="steps-heading" className="bg-card border border-border rounded-xl p-5">
            <h2 id="steps-heading" className="text-sm font-medium text-muted-foreground mb-3">
              Steps
            </h2>
            {data.steps.length ? (
              <ol className="space-y-2 list-none m-0 p-0">
                {data.steps.map((s, i) => (
                  <li
                    key={s.step_id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-muted-foreground w-6" aria-label={`Step ${i + 1}`}>{i + 1}.</span>
                    <span className="font-mono">{s.step_name}</span>
                    <Badge label={s.status} variant="muted" />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground" role="status">No steps.</p>
            )}
          </section>

          {data.artifacts.length > 0 && (
            <section aria-labelledby="artifacts-heading" className="bg-card border border-border rounded-xl p-5">
              <h2 id="artifacts-heading" className="text-sm font-medium text-muted-foreground mb-3">
                Artifacts
              </h2>
              <ul className="list-none m-0 p-0">
                {data.artifacts.map((a) => (
                  <li key={a.artifact_id} className="text-sm py-1">
                    <span className="font-mono">{a.filename}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {a.mime_type}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.agents.length > 0 && (
            <section aria-labelledby="agents-heading" className="bg-card border border-border rounded-xl p-5">
              <h2 id="agents-heading" className="text-sm font-medium text-muted-foreground mb-3">
                Agents
              </h2>
              <ul className="list-none m-0 p-0">
                {data.agents.map((a) => (
                  <li key={a.agent_id} className="text-sm py-1 font-mono">
                    {a.alias} ({a.agent_id.slice(0, 12)})
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" role="status">Workflow not found.</p>
      )}
    </div>
  );
}
