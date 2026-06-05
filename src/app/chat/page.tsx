"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJarvis } from "@/hooks/useJarvis";
import { useChat } from "@/hooks/useChat";
import { SessionList } from "@/components/chat/SessionList";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";

export default function ChatPage() {
  const { connected, ws } = useJarvis();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { messages, sending, sendMessage, approveTool } = useChat(sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Pick up session from WebSocket
  useEffect(() => {
    if (ws && !sessionId) {
      const sid = ws.getSessionId();
      if (sid) setSessionId(sid);
    }
  }, [ws, sessionId]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6">
      <SessionList activeSessionId={sessionId} onSelect={setSessionId} />

      <div className="flex-1 flex flex-col">
        <DisconnectedBanner />

        {/* role="log" marks this as a live chat transcript; aria-live="polite" + aria-atomic="false"
            lets screen readers announce each new message without interrupting ongoing speech. */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-4"
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Chat messages"
        >
          <ul className="max-w-4xl mx-auto space-y-4 list-none">
            {messages.length === 0 && (
              <li className="flex flex-col items-center justify-center h-full text-center py-20">
                <div
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                  aria-hidden="true"
                >
                  <span className="text-primary font-display font-bold text-2xl">J</span>
                </div>
                <h1 className="font-display font-semibold text-lg mb-1">JARVIS Console</h1>
                <p className="text-muted-foreground text-sm">
                  Send a message to start a conversation.
                </p>
              </li>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onApproveTool={approveTool}
              />
            ))}
          </ul>
        </div>

        <ChatInput onSend={handleSend} disabled={!connected || sending} />
      </div>
    </div>
  );
}
