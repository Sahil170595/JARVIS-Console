"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createJarvisClient, type JarvisClient } from "@/lib/jarvis-client";
import { JarvisWebSocket } from "@/lib/jarvis-ws";
import { HEALTH_POLL_INTERVAL } from "@/lib/constants";

interface JarvisContextValue {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  client: JarvisClient | null;
  ws: JarvisWebSocket | null;
  connected: boolean;
  wsConnected: boolean;
}

const JarvisContext = createContext<JarvisContextValue>({
  apiKey: null,
  setApiKey: () => {},
  client: null,
  ws: null,
  connected: false,
  wsConnected: false,
});

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<JarvisWebSocket | null>(null);

  // Load key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("jarvis-api-key");
    if (stored) setApiKeyState(stored);
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    if (key) {
      localStorage.setItem("jarvis-api-key", key);
    } else {
      localStorage.removeItem("jarvis-api-key");
    }
    setApiKeyState(key);
  }, []);

  const client = useMemo(
    () => (apiKey ? createJarvisClient(apiKey) : null),
    [apiKey]
  );

  // Health polling
  useEffect(() => {
    if (!client) {
      setConnected(false);
      return;
    }
    let active = true;
    const check = async () => {
      const res = await client.health();
      if (active) setConnected(res.ok);
    };
    check();
    const timer = setInterval(check, HEALTH_POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [client]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!apiKey) {
      wsRef.current?.disconnect();
      wsRef.current = null;
      setWsConnected(false);
      return;
    }
    const ws = new JarvisWebSocket(apiKey);
    ws.onStatus(setWsConnected);
    ws.connect();
    wsRef.current = ws;
    return () => ws.disconnect();
  }, [apiKey]);

  const value = useMemo(
    () => ({
      apiKey,
      setApiKey,
      client,
      ws: wsRef.current,
      connected,
      wsConnected,
    }),
    [apiKey, setApiKey, client, connected, wsConnected]
  );

  return (
    <JarvisContext.Provider value={value}>{children}</JarvisContext.Provider>
  );
}

export function useJarvis() {
  return useContext(JarvisContext);
}
