export const JARVIS_URL =
  process.env.NEXT_PUBLIC_JARVIS_URL || "http://localhost:8400";

export const JARVIS_WS_URL = JARVIS_URL.replace(/^http/, "ws");

export const API_PREFIX = "/jarvis/v2";
export const WS_PATH = "/jarvis/v2/stream";

export const HEALTH_POLL_INTERVAL = 10_000;
export const WS_RECONNECT_BASE_MS = 1_000;
export const WS_RECONNECT_MAX_MS = 30_000;
export const WS_PING_INTERVAL_MS = 25_000;
