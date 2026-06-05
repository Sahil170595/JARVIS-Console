"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useJarvis } from "@/hooks/useJarvis";
import { JARVIS_URL, API_PREFIX } from "@/lib/constants";

const FOCUSABLE_SELECTORS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function LoginDialog() {
  const { apiKey, setApiKey } = useJarvis();
  const [input, setInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isOpen = !apiKey;

  // Save previously-focused element, move focus into dialog on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Defer to let the dialog paint before focusing
      const raf = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // Restore focus when dialog closes (e.g. after successful connect)
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  const handleConnect = async () => {
    const key = input.trim();
    if (!key) return;

    setTesting(true);
    setError(null);

    try {
      const res = await fetch(`${JARVIS_URL}${API_PREFIX}/health`, {
        headers: { "X-Jarvis-Key": key },
      });
      if (res.ok) {
        setApiKey(key);
      } else {
        setError(`JARVIS returned ${res.status}`);
      }
    } catch {
      setError("Cannot reach JARVIS");
    } finally {
      setTesting(false);
    }
  };

  // Focus trap + Escape handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        // Dialog is a required gate — Escape does nothing here (no close action),
        // but the handler is wired so screen readers and keyboards behave correctly.
        return;
      }

      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest("[aria-hidden='true']"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    /* Backdrop — layout wrapper only; aria-modal on the inner dialog tells AT to
       treat everything outside the dialog as inert, so no aria-hidden here */
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-dialog-title"
        onKeyDown={handleKeyDown}
        className="bg-card border border-border rounded-xl p-8 w-full max-w-md animate-fade-in"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-primary font-display font-bold text-lg" aria-hidden="true">
              J
            </span>
          </div>
          <div>
            <h2
              id="login-dialog-title"
              className="font-display font-bold text-lg"
            >
              JARVIS Console
            </h2>
            <p className="text-muted-foreground text-sm">{JARVIS_URL}</p>
          </div>
        </div>

        <label htmlFor="login-api-key" className="block text-sm text-muted-foreground mb-2">
          API Key
        </label>
        <input
          ref={inputRef}
          id="login-api-key"
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          placeholder="jarvis-demo-key"
          autoComplete="current-password"
          aria-describedby={error ? "login-error" : undefined}
          className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono text-sm"
        />

        {error && (
          <p
            id="login-error"
            role="alert"
            className="text-destructive text-sm mt-2"
          >
            {error}
          </p>
        )}

        <button
          onClick={handleConnect}
          disabled={testing || !input.trim()}
          className="w-full mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {testing ? "Connecting…" : "Connect"}
        </button>
      </div>
    </div>
  );
}
