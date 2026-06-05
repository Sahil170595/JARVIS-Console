"use client";

import Link from "next/link";
import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Badge } from "@/components/shared/Badge";
import { Spinner } from "@/components/shared/Spinner";
import type { Workflow } from "@/lib/types";
import { GitBranch } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted" | "primary"> = {
  completed: "success",
  running: "primary",
  paused: "warning",
  failed: "destructive",
  cancelled: "muted",
};

export default function WorkflowsPage() {
  const { client } = useJarvis();

  const { data, loading } = usePolling<{ workflows: Workflow[] }>(
    () => client!.getWorkflows(),
    10_000
  );

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <GitBranch size={20} className="text-primary" aria-hidden="true" /> Workflows
      </h1>
      <DisconnectedBanner />

      {loading ? (
        <Spinner />
      ) : (data?.workflows || []).length ? (
        <div
          className="bg-card border border-border rounded-xl overflow-hidden"
          aria-live="polite"
          aria-atomic="false"
        >
          <table className="w-full text-sm" aria-label="Workflows">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th scope="col" className="px-4 py-3 font-medium">Title</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Origin</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {data!.workflows.map((w) => (
                <tr
                  key={w.workflow_id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/workflows/${w.workflow_id}`}
                      className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      {w.title || w.workflow_id.slice(0, 12)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={w.status}
                      variant={STATUS_VARIANT[w.status] || "muted"}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{w.origin}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <time dateTime={w.created_at}>{new Date(w.created_at).toLocaleString()}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" role="status">No workflows yet.</p>
      )}
    </div>
  );
}
