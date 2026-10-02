"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MESSAGES: Record<string, string> = {
  invalid: "That password didn’t match. Try again.",
  rate_limited: "Too many attempts. Wait a minute, then try again.",
  not_configured: "The editor isn’t set up yet (no password configured on the server).",
  forbidden: "That request was blocked. Reload the page and try again.",
  bad_request: "Something went wrong sending the form. Try again.",
  network: "Couldn’t reach the server. Check your connection and try again.",
};

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { code?: string };
      setError(MESSAGES[body.code ?? ""] ?? MESSAGES.bad_request);
    } catch {
      setError(MESSAGES.network);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="block font-mono text-xs uppercase tracking-wider text-graphite">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-hairline bg-floor px-4 py-3 text-ink outline-none focus-visible:ring-2 focus-visible:ring-qc"
          autoFocus
          required
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-hairline bg-label px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || password.length === 0}
        className="w-full rounded-lg bg-qc px-4 py-3 font-medium text-on-qc transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
