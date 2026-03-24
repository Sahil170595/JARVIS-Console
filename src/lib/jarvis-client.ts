import { JARVIS_URL, API_PREFIX } from "./constants";
import type {
  ChatResponse,
  TurnResponse,
  SystemStatus,
  CognitiveEloResponse,
  ControlRoomResponse,
  MemoryResponse,
  Tool,
  Workflow,
  WorkflowDetail,
  CalendarEvent,
  InboxMessage,
  Notification,
  UsageResponse,
  UserSettings,
  Session,
  AuditEvent,
} from "./types";

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T>(
  path: string,
  apiKey: string,
  options?: RequestInit
): Promise<FetchResult<T>> {
  try {
    const url = `${JARVIS_URL}${API_PREFIX}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Jarvis-Key": apiKey,
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      return { ok: false, error: `${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function createJarvisClient(apiKey: string) {
  const get = <T>(path: string) => request<T>(path, apiKey);
  const post = <T>(path: string, body?: unknown) =>
    request<T>(path, apiKey, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  const del = <T>(path: string) =>
    request<T>(path, apiKey, { method: "DELETE" });

  return {
    // Health
    health: () => get<{ status: string }>("/health"),

    // Chat
    chat: (message: string, sessionId?: string) =>
      post<ChatResponse>("/chat", {
        message,
        idempotency_key: crypto.randomUUID(),
        session_id: sessionId,
        mode: "async",
      }),
    getTurn: (turnId: string) => get<TurnResponse>(`/turns/${turnId}`),
    cancelTurn: (turnId: string) =>
      post<TurnResponse>(`/turns/${turnId}/cancel`),

    // Sessions
    getSessions: (limit = 50) => get<{ sessions: Session[] }>(`/sessions?limit=${limit}`),

    // System
    getSystemStatus: () => get<SystemStatus>("/system/status"),
    getCognitiveElo: () => get<CognitiveEloResponse>("/cognitive/elo"),
    getControlRoom: () => get<ControlRoomResponse>("/control-room"),

    // Tools
    getTools: () => get<{ tools: Tool[] }>("/tools"),
    approveTool: (toolRunId: string) =>
      post<{ approval_id: string }>("/tools/approve", {
        tool_run_id: toolRunId,
      }),

    // Audits
    getAudits: (limit = 50) =>
      get<{ audits: AuditEvent[] }>(`/audits?limit=${limit}`),

    // Memory
    getMemory: () => get<MemoryResponse>("/memory"),
    deleteMemory: (memoryId: string) => del<{ ok: boolean }>(`/memory/${memoryId}`),
    deleteFact: (factId: string) => del<{ ok: boolean }>(`/facts/${factId}`),

    // Workflows
    getWorkflows: (limit = 50) =>
      get<{ workflows: Workflow[] }>(`/workflows?limit=${limit}`),
    getWorkflow: (id: string) => get<WorkflowDetail>(`/workflows/${id}`),

    // Calendar + Inbox
    getCalendarEvents: (limit = 50) =>
      get<{ events: CalendarEvent[] }>(`/calendar/events?limit=${limit}`),
    getInboxMessages: (limit = 50) =>
      get<{ messages: InboxMessage[] }>(`/inbox/messages?limit=${limit}`),
    markInboxRead: (id: string) =>
      post<{ ok: boolean }>(`/inbox/messages/${id}/mark-read`),

    // Notifications
    getNotifications: (limit = 50) =>
      get<{ notifications: Notification[] }>(`/notifications?limit=${limit}`),
    markNotificationRead: (id: string) =>
      post<{ ok: boolean }>(`/notifications/${id}/mark-read`),

    // Usage + Settings
    getUsage: () => get<UsageResponse>("/usage"),
    getUserSettings: () => get<UserSettings>("/user/settings"),
  };
}

export type JarvisClient = ReturnType<typeof createJarvisClient>;
