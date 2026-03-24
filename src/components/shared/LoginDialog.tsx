"use client";

import { useState } from "react";
import { useJarvis } from "@/hooks/useJarvis";
import { JARVIS_URL } from "@/lib/constants";

export function LoginDialog() {
  const { apiKey, setApiKey } = useJarvis();
  const [input, setInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (apiKey) return null;

  const handleConnect = async () => {
    const key = input.trim();
    if (!key) return;

    setTesting(true);
    setError(null);

    try {
      const res = await fetch(`${JARVIS_URL}/jarvis/v2/health`, {
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

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-display font-bold text-lg">J</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">JARVIS Console</h1>
            <p className="text-muted-foreground text-sm">{JARVIS_URL}</p>
          </div>
        </div>

        <label className="block text-sm text-muted-foreground mb-2">
          API Key
        </label>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          placeholder="jarvis-demo-key"
          className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
          autoFocus
        />

        {error && (
          <p className="text-destructive text-sm mt-2">{error}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={testing || !input.trim()}
          className="w-full mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? "Connecting..." : "Connect"}
        </button>
      </div>
    </div>
  );
}
