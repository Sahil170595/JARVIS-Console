"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJarvis } from "./useJarvis";
import type { WSEvent } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  turnId?: string;
  isStreaming?: boolean;
  toolRuns?: ToolRunInfo[];
}

export interface ToolRunInfo {
  toolRunId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  riskTier: string;
  status: "proposed" | "approval_required" | "approved" | "executing" | "completed" | "failed";
  result?: Record<string, unknown>;
  warnings?: string[];
}

export function useChat(sessionId: string | null) {
  const { client, ws } = useJarvis();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const streamingRef = useRef<string>("");

  // WebSocket event handlers
  useEffect(() => {
    if (!ws) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      ws.on("assistant.delta", (e: WSEvent) => {
        const delta = (e.payload.delta as string) || "";
        streamingRef.current += delta;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.turnId === e.turn_id && last?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: streamingRef.current, isStreaming: true },
            ];
          }
          return [
            ...prev,
            {
              id: `assistant-${e.turn_id}`,
              role: "assistant",
              content: streamingRef.current,
              turnId: e.turn_id || undefined,
              isStreaming: true,
            },
          ];
        });
      })
    );

    unsubs.push(
      ws.on("assistant.final", (e: WSEvent) => {
        const text = (e.payload.final_response as string) || streamingRef.current;
        streamingRef.current = "";
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.turnId === e.turn_id && last?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: text, isStreaming: false },
            ];
          }
          return prev;
        });
      })
    );

    unsubs.push(
      ws.on("tool.proposed", (e: WSEvent) => {
        const payload = e.payload;
        const toolRun: ToolRunInfo = {
          toolRunId: (payload.tool_run_id as string) || "",
          toolName: ((payload.tool_run as Record<string, unknown>)?.tool_name as string) || "",
          toolArgs: ((payload.tool_run as Record<string, unknown>)?.tool_args as Record<string, unknown>) || {},
          riskTier: ((payload.tool_run as Record<string, unknown>)?.risk_tier as string) || "low",
          status: "proposed",
        };
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.turnId === e.turn_id) {
            return [
              ...prev.slice(0, -1),
              { ...last, toolRuns: [...(last.toolRuns || []), toolRun] },
            ];
          }
          return prev;
        });
      })
    );

    unsubs.push(
      ws.on("tool.approval_required", (e: WSEvent) => {
        updateToolStatus(e.turn_id, (e.payload.tool_run_id as string) || "", "approval_required");
      })
    );

    unsubs.push(
      ws.on("tool.started", (e: WSEvent) => {
        updateToolStatus(e.turn_id, (e.payload.tool_run_id as string) || "", "executing");
      })
    );

    unsubs.push(
      ws.on("tool.result", (e: WSEvent) => {
        const run = e.payload.tool_run as Record<string, unknown> | undefined;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.turnId !== e.turn_id || !m.toolRuns) return m;
            return {
              ...m,
              toolRuns: m.toolRuns.map((tr) =>
                tr.toolRunId === ((run?.tool_run_id as string) || "")
                  ? {
                      ...tr,
                      status: (run?.ok ? "completed" : "failed") as ToolRunInfo["status"],
                      result: (run?.result as Record<string, unknown>) || undefined,
                      warnings: (run?.warnings as string[]) || undefined,
                    }
                  : tr
              ),
            };
          })
        );
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [ws]);

  const updateToolStatus = (turnId: string | null, toolRunId: string, status: ToolRunInfo["status"]) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.turnId !== turnId || !m.toolRuns) return m;
        return {
          ...m,
          toolRuns: m.toolRuns.map((tr) =>
            tr.toolRunId === toolRunId ? { ...tr, status } : tr
          ),
        };
      })
    );
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!client || !text.trim() || sending) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      streamingRef.current = "";

      const res = await client.chat(text.trim(), sessionId || undefined);
      if (res.ok) {
        // Turn created — streaming will deliver the response via WebSocket
        const turnId = res.data.turn_id;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === userMsg.id) {
            return [...prev.slice(0, -1), { ...last, turnId }];
          }
          return prev;
        });

        // If sync response already available
        if (res.data.final_response) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${turnId}`,
              role: "assistant",
              content: res.data.final_response!,
              turnId,
              isStreaming: false,
            },
          ]);
        }
      }

      setSending(false);
    },
    [client, sessionId, sending]
  );

  const approveTool = useCallback(
    async (toolRunId: string) => {
      if (!client) return;
      await client.approveTool(toolRunId);
    },
    [client]
  );

  return { messages, sending, sendMessage, approveTool };
}
