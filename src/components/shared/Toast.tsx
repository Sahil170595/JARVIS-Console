"use client";

/**
 * P109.3 — Minimal toast notification system.
 *
 * Ported from the Tauri DebateViewer's toast pattern but rebuilt as a tiny
 * React context + portal so it's reusable across the whole jarvis-console
 * (not just /debate). Uses framer-motion (already in deps) for fade/slide.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.info("message"); toast.success(...); toast.error(...);
 *
 * Wrap the app once with <ToastProvider> in layout.tsx.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type ToastKind = "info" | "success" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  info(text: string): void;
  success(text: string): void;
  error(text: string): void;
  dismiss(id: number): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4_500;

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Allow calling outside provider — no-op so dev-mode hot-reload doesn't crash.
    return {
      info: () => undefined,
      success: () => undefined,
      error: () => undefined,
      dismiss: () => undefined,
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // P109.3: memoize so consumer useEffect deps don't fire on every render.
  // push/dismiss are already useCallback-stable; api wraps both.
  const api = useMemo<ToastApi>(
    () => ({
      info: (t) => push("info", t),
      success: (t) => push("success", t),
      error: (t) => push("error", t),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[200] flex flex-col-reverse gap-2 max-w-sm pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            layout
            initial={reduced ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: "easeOut" }}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 backdrop-blur-md ${
              t.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : t.kind === "error"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                : "border-border bg-card/90 text-foreground"
            }`}
          >
            {t.kind === "success" ? (
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : t.kind === "error" ? (
              <AlertCircle aria-hidden="true" className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <Info aria-hidden="true" className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm flex-1 break-words">{t.text}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Dismiss notification"
            >
              <X aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
