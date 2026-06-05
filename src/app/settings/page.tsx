"use client";

import { useJarvis } from "@/hooks/useJarvis";
import { usePolling } from "@/hooks/usePolling";
import { DisconnectedBanner } from "@/components/shared/DisconnectedBanner";
import { Spinner } from "@/components/shared/Spinner";
import type { UsageResponse, UserSettings, Notification } from "@/lib/types";
import { Settings, Key, BarChart3, Bell } from "lucide-react";
import { JARVIS_URL } from "@/lib/constants";

export default function SettingsPage() {
  const { client, apiKey, setApiKey } = useJarvis();

  const usage = usePolling<UsageResponse>(() => client!.getUsage(), 0);
  const settings = usePolling<UserSettings>(
    () => client!.getUserSettings(),
    0
  );
  const notifs = usePolling<{ notifications: Notification[] }>(
    () => client!.getNotifications(20),
    15_000
  );

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
        <Settings size={20} className="text-primary" aria-hidden="true" />{" "}
        Settings
      </h1>
      <DisconnectedBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection */}
        <section
          aria-labelledby="section-connection"
          className="bg-card border border-border rounded-xl p-5 animate-fade-in"
        >
          <h2
            id="section-connection"
            className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"
          >
            <Key size={14} aria-hidden="true" /> Connection
          </h2>
          <p className="text-sm mb-1">
            <span className="text-muted-foreground">URL:</span>{" "}
            <span className="font-mono">{JARVIS_URL}</span>
          </p>
          <p className="text-sm mb-3">
            <span className="text-muted-foreground">Key:</span>{" "}
            <span className="font-mono">
              {apiKey ? `${apiKey.slice(0, 8)}...` : "none"}
            </span>
          </p>
          <button
            onClick={() => setApiKey(null)}
            className="text-sm text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label="Disconnect from JARVIS"
          >
            Disconnect
          </button>
        </section>

        {/* User Settings */}
        <section
          aria-labelledby="section-user-settings"
          className="bg-card border border-border rounded-xl p-5 animate-fade-in"
        >
          <h2
            id="section-user-settings"
            className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"
          >
            <Settings size={14} aria-hidden="true" /> User Settings
          </h2>
          {settings.loading ? (
            <Spinner />
          ) : settings.data ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Cross-session memory</dt>
                <dd
                  className={
                    settings.data.cross_session_memory_enabled
                      ? "text-success"
                      : "text-muted-foreground"
                  }
                  aria-label={`Cross-session memory: ${settings.data.cross_session_memory_enabled ? "On" : "Off"}`}
                >
                  {settings.data.cross_session_memory_enabled ? "On" : "Off"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Proactive notifications</dt>
                <dd
                  className={
                    settings.data.proactive_enabled
                      ? "text-success"
                      : "text-muted-foreground"
                  }
                  aria-label={`Proactive notifications: ${settings.data.proactive_enabled ? "On" : "Off"}`}
                >
                  {settings.data.proactive_enabled ? "On" : "Off"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Unavailable</p>
          )}
        </section>

        {/* Usage */}
        <section
          aria-labelledby="section-usage"
          className="bg-card border border-border rounded-xl p-5 animate-fade-in"
        >
          <h2
            id="section-usage"
            className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"
          >
            <BarChart3 size={14} aria-hidden="true" /> Usage
          </h2>
          {usage.loading ? (
            <Spinner />
          ) : usage.data ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Total turns</dt>
                <dd className="font-mono">
                  {usage.data.total_turns.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Total tokens</dt>
                <dd className="font-mono">
                  {usage.data.total_tokens.toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Unavailable</p>
          )}
        </section>

        {/* Notifications */}
        <section
          aria-labelledby="section-notifications"
          className="bg-card border border-border rounded-xl p-5 animate-fade-in"
        >
          <h2
            id="section-notifications"
            className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"
          >
            <Bell size={14} aria-hidden="true" /> Notifications
          </h2>
          {notifs.loading ? (
            <Spinner />
          ) : (notifs.data?.notifications || []).length ? (
            <ul
              aria-label="Recent notifications"
              className="space-y-2 max-h-48 overflow-y-auto"
            >
              {notifs.data!.notifications.map((n) => (
                <li
                  key={n.notification_id}
                  className={`text-sm p-2 rounded-lg ${
                    n.read_at
                      ? "bg-muted/30"
                      : "bg-primary/5 border border-primary/20"
                  }`}
                >
                  {!n.read_at && <span className="sr-only">Unread: </span>}
                  <p>{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {n.trigger_type} &middot;{" "}
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications.</p>
          )}
        </section>
      </div>
    </div>
  );
}
