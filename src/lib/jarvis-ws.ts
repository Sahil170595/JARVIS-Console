import {
  JARVIS_WS_URL,
  WS_PATH,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  WS_PING_INTERVAL_MS,
} from "./constants";
import type { WSEvent, WSEventType } from "./types";

type EventHandler = (event: WSEvent) => void;
type StatusHandler = (connected: boolean) => void;

export class JarvisWebSocket {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private sessionId: string | null = null;
  private lastSeq = 0;
  private handlers = new Map<string, Set<EventHandler>>();
  private statusHandlers = new Set<StatusHandler>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private closed = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  connect(sessionId?: string) {
    this.closed = false;
    this.sessionId = sessionId || null;
    this._connect();
  }

  private _connect() {
    if (this.closed) return;

    try {
      const url = `${JARVIS_WS_URL}${WS_PATH}`;
      this.ws = new WebSocket(url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      const hello: Record<string, unknown> = {
        type: "client.hello",
        token: this.apiKey,
      };
      if (this.sessionId) hello.session_id = this.sessionId;
      this.ws!.send(JSON.stringify(hello));
    };

    this.ws.onmessage = (e) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(e.data as string);
      } catch {
        return;
      }

      const type = data.type as string;

      if (type === "server.hello") {
        this.reconnectAttempt = 0;
        this.sessionId = (data.session_id as string) || this.sessionId;
        this._notifyStatus(true);
        this._startPing();

        // Resume missed events if reconnecting
        if (this.lastSeq > 0) {
          this.ws!.send(
            JSON.stringify({ type: "client.resume", last_seq: this.lastSeq })
          );
        }
        return;
      }

      if (type === "server.ping") {
        this.ws!.send(JSON.stringify({ type: "client.ping" }));
        return;
      }

      if (type === "server.pong" || type === "server.error") {
        return;
      }

      // Stream event
      const event = data as unknown as WSEvent;
      if (event.seq) this.lastSeq = event.seq;
      this._dispatch(event);
    };

    this.ws.onclose = () => {
      this._stopPing();
      this._notifyStatus(false);
      this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  disconnect() {
    this.closed = true;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._notifyStatus(false);
  }

  on(eventType: WSEventType | "*", handler: EventHandler) {
    const key = eventType;
    if (!this.handlers.has(key)) this.handlers.set(key, new Set());
    this.handlers.get(key)!.add(handler);
    return () => this.handlers.get(key)?.delete(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getSessionId() {
    return this.sessionId;
  }

  private _dispatch(event: WSEvent) {
    // Specific handlers
    this.handlers.get(event.type)?.forEach((h) => h(event));
    // Wildcard handlers
    this.handlers.get("*")?.forEach((h) => h(event));
  }

  private _notifyStatus(connected: boolean) {
    this.statusHandlers.forEach((h) => h(connected));
  }

  private _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "client.ping" }));
      }
    }, WS_PING_INTERVAL_MS);
  }

  private _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private _scheduleReconnect() {
    if (this.closed) return;
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempt),
      WS_RECONNECT_MAX_MS
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }
}
