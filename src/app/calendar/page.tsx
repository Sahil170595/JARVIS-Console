"use client";

import { useState } from "react";
import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Spinner } from "@/components/shared/Spinner";
import type { CalendarEvent, InboxMessage } from "@/lib/types";
import { Calendar, Inbox, Mail, CheckCircle } from "lucide-react";

export default function CalendarPage() {
  const { client } = useJarvis();
  const reducedMotion = useReducedMotion();
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
        <Calendar size={20} className="text-primary" aria-hidden="true" /> Calendar &amp; Inbox
      </h1>
      <DisconnectedBanner />

      <div role="tablist" aria-label="Calendar and inbox sections" className="flex gap-2 mb-4">
        <button
          role="tab"
          aria-selected={tab === "calendar"}
          aria-controls="panel-calendar"
          id="tab-calendar"
          onClick={() => setTab("calendar")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            tab === "calendar"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar size={14} className="inline mr-1.5" aria-hidden="true" />
          Calendar
        </button>
        <button
          role="tab"
          aria-selected={tab === "inbox"}
          aria-controls="panel-inbox"
          id="tab-inbox"
          onClick={() => setTab("inbox")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            tab === "inbox"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox size={14} className="inline mr-1.5" aria-hidden="true" />
          Inbox
        </button>
      </div>

      {tab === "calendar" ? (
        cal.loading ? (
          <div aria-live="polite">
            <Spinner />
          </div>
        ) : (
          <div
            id="panel-calendar"
            role="tabpanel"
            aria-labelledby="tab-calendar"
            aria-live="polite"
          >
            <ul role="list" className="space-y-2">
              {(cal.data?.events || []).map((e) => (
                <li
                  key={e.event_id}
                  className={`bg-card border border-border rounded-lg p-4${reducedMotion ? "" : " animate-fade-in"}`}
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
                </li>
              ))}
            </ul>
            {!cal.data?.events.length && (
              <p role="status" className="text-sm text-muted-foreground">
                No calendar events.
              </p>
            )}
          </div>
        )
      ) : inbox.loading ? (
        <div aria-live="polite">
          <Spinner />
        </div>
      ) : (
        <div
          id="panel-inbox"
          role="tabpanel"
          aria-labelledby="tab-inbox"
          aria-live="polite"
        >
          <ul role="list" className="space-y-2">
            {(inbox.data?.messages || []).map((m) => (
              <li
                key={m.message_id}
                className={`bg-card border rounded-lg p-4${reducedMotion ? "" : " animate-fade-in"} ${
                  m.is_read ? "border-border" : "border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {m.is_read ? (
                      <CheckCircle
                        size={14}
                        className="text-muted-foreground"
                        aria-label="Read"
                      />
                    ) : (
                      <Mail
                        size={14}
                        className="text-primary"
                        aria-label="Unread"
                      />
                    )}
                    <span className="text-sm font-medium">{m.subject}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {m.sender}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {!inbox.data?.messages.length && (
            <p role="status" className="text-sm text-muted-foreground">Inbox is empty.</p>
          )}
        </div>
      )}
    </div>
  );
}
