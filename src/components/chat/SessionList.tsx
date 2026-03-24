"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import type { Session } from "@/lib/types";
import { MessageSquare, Plus } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

interface SessionListProps {
  activeSessionId: string | null;
  onSelect: (sessionId: string | null) => void;
}

export function SessionList({ activeSessionId, onSelect }: SessionListProps) {
  const { client } = useJarvis();

  const { data, loading } = usePolling<{ sessions: Session[] }>(
    () => client!.getSessions(20),
    30_000
  );

  const sessions = data?.sessions || [];

  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Sessions</span>
        <button
          onClick={() => onSelect(null)}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="New session"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && !sessions.length && (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        )}

        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className={`w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors ${
              activeSessionId === s.session_id ? "bg-muted/70" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={12} className="text-muted-foreground shrink-0" />
              <span className="text-sm truncate">
                {s.summary || `Session ${s.session_id.slice(0, 8)}`}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 pl-5">
              {s.turn_count} turn{s.turn_count !== 1 ? "s" : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
