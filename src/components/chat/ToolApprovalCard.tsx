"use client";

import type { ToolRunInfo } from "@/hooks/useChat";
import { Shield, Check, X, Loader2, AlertTriangle } from "lucide-react";

interface ToolApprovalCardProps {
  toolRun: ToolRunInfo;
  onApprove?: (toolRunId: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  low: "text-success border-success/30 bg-success/5",
  medium: "text-warning border-warning/30 bg-warning/5",
  high: "text-destructive border-destructive/30 bg-destructive/5",
  critical: "text-destructive border-destructive/50 bg-destructive/10",
};

export function ToolApprovalCard({ toolRun, onApprove }: ToolApprovalCardProps) {
  const riskStyle = RISK_COLORS[toolRun.riskTier] || RISK_COLORS.low;

  return (
    <div className={`mt-2 rounded-lg border p-3 text-sm ${riskStyle} animate-slide-up`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} />
          <span className="font-mono font-medium">{toolRun.toolName}</span>
          <span className="text-xs opacity-70">{toolRun.riskTier}</span>
        </div>

        {toolRun.status === "approval_required" && onApprove && (
          <button
            onClick={() => onApprove(toolRun.toolRunId)}
            className="flex items-center gap-1 bg-success/20 text-success px-2.5 py-1 rounded-md text-xs font-medium hover:bg-success/30 transition-colors"
          >
            <Check size={12} /> Approve
          </button>
        )}

        {toolRun.status === "executing" && (
          <Loader2 size={14} className="animate-spin opacity-70" />
        )}

        {toolRun.status === "completed" && (
          <Check size={14} className="text-success" />
        )}

        {toolRun.status === "failed" && (
          <X size={14} className="text-destructive" />
        )}
      </div>

      {toolRun.toolArgs && Object.keys(toolRun.toolArgs).length > 0 && (
        <pre className="mt-2 text-xs font-mono opacity-70 overflow-x-auto">
          {JSON.stringify(toolRun.toolArgs, null, 2)}
        </pre>
      )}

      {toolRun.warnings?.map((w, i) => (
        <div key={i} className="mt-2 flex items-start gap-1.5 text-xs">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>{w}</span>
        </div>
      ))}

      {toolRun.result && (
        <pre className="mt-2 text-xs font-mono opacity-70 overflow-x-auto max-h-32">
          {JSON.stringify(toolRun.result, null, 2)}
        </pre>
      )}
    </div>
  );
}
