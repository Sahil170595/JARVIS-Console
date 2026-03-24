"use client";

import type { ChatMessage, ToolRunInfo } from "@/hooks/useChat";
import { ToolApprovalCard } from "./ToolApprovalCard";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  onApproveTool?: (toolRunId: string) => void;
}

export function MessageBubble({ message, onApproveTool }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
          <Bot size={16} className="text-primary" />
        </div>
      )}

      <div className={`max-w-2xl ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {message.toolRuns?.map((tr) => (
          <ToolApprovalCard
            key={tr.toolRunId}
            toolRun={tr}
            onApprove={onApproveTool}
          />
        ))}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
          <User size={16} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
