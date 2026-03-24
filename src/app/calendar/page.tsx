"use client";

import { useState } from "react";
import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Spinner } from "@/components/shared/Spinner";
import type { CalendarEvent, InboxMessage } from "@/lib/types";
import { Calendar, Inbox, Mail, CheckCircle } from "lucide-react";

export default function CalendarPage() {
  const { client } = useJarvis();
  const [tab, setTab] = useState<"calendar" | "inbox">("calendar");

  const cal = usePolling<{ events: CalendarEvent[] }>(
    () => client!.getCalendarEvents(),
    30_000
  );
  const inbox = usePolling<{ messages: InboxMessage[] }>(
    () => client!.getInboxMessages(),
    15_000
  );

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <Calendar size={20} className="text-primary" /> Calendar & Inbox
      </h1>
      <DisconnectedBanner />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("calendar")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === "calendar"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar size={14} className="inline mr-1.5" />
          Calendar
        </button>
        <button
          onClick={() => setTab("inbox")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === "inbox"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox size={14} className="inline mr-1.5" />
          Inbox
        </button>
      </div>

      {tab === "calendar" ? (
        cal.loading ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
            {(cal.data?.events || []).map((e) => (
              <div
                key={e.event_id}
                className="bg-card border border-border rounded-lg p-4 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{e.summary}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.start_at).toLocaleString()}
                  </span>
                </div>
                {e.location && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {e.location}
                  </p>
                )}
              </div>
            ))}
            {!cal.data?.events.length && (
              <p className="text-sm text-muted-foreground">
                No calendar events.
              </p>
            )}
          </div>
        )
      ) : inbox.loading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {(inbox.data?.messages || []).map((m) => (
            <div
              key={m.message_id}
              className={`bg-card border rounded-lg p-4 animate-fade-in ${
                m.is_read ? "border-border" : "border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.is_read ? (
                    <CheckCircle size={14} className="text-muted-foreground" />
                  ) : (
                    <Mail size={14} className="text-primary" />
                  )}
                  <span className="text-sm font-medium">{m.subject}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {m.sender}
                </span>
              </div>
            </div>
          ))}
          {!inbox.data?.messages.length && (
            <p className="text-sm text-muted-foreground">Inbox is empty.</p>
          )}
        </div>
      )}
    </div>
  );
}
