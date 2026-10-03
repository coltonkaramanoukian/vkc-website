"use client";

import { useState } from "react";
import type { FieldError } from "@/lib/admin/validate";

type Status = "idle" | "saving" | "saved" | "error";

const BANNER: Record<string, string> = {
  invalid: "Some fields need attention — see the notes below.",
  unauthorized: "Your session expired. Reload the page and sign in again.",
  forbidden: "That request was blocked. Reload the page and try again.",
  not_configured: "Nothing was saved: no content store is configured on the server. In production this needs the GitHub token (see NEEDS-COLTON.md).",
  write_failed: "The save reached the server but couldn’t be written. Check the server logs.",
  bad_request: "Something went wrong sending the form. Try again.",
  network: "Couldn’t reach the server. Check your connection and try again.",
};

function errorKey(error: FieldError): string {
  return error.index === undefined ? error.path : `${error.index}:${error.path}`;
}

export function useSave() {
  const [status, setStatus] = useState<Status>("idle");
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  async function save(payload: unknown, endpoint = "/api/admin/save") {
    setStatus("saving");
    setBannerError(null);
    setFieldErrors(new Map());
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setStatus("saved");
        return true;
      }
      const body = (await response.json().catch(() => ({}))) as { code?: string; errors?: FieldError[] };
      if (body.errors && body.errors.length > 0) {
        const map = new Map<string, string>();
        for (const error of body.errors) if (!map.has(errorKey(error))) map.set(errorKey(error), error.message);
        setFieldErrors(map);
      }
      setBannerError(BANNER[body.code ?? ""] ?? BANNER.bad_request);
      setStatus("error");
      return false;
    } catch {
      setBannerError(BANNER.network);
      setStatus("error");
      return false;
    }
  }

  return { status, bannerError, fieldErrors, save };
}

export function SaveBar({ status, bannerError }: { status: Status; bannerError: string | null }) {
  return (
    <div className="sticky bottom-0 -mx-4 border-t border-hairline bg-floor/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-b-2xl">
      {bannerError && (
        <p role="alert" className="mb-3 rounded-lg border border-hairline bg-label px-4 py-3 text-sm text-ink">
          {bannerError}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <span aria-live="polite" className="text-sm text-graphite">
          {status === "saved" && <span className="text-ink">Saved ✓</span>}
          {status === "saving" && "Saving…"}
          {status === "error" && "Not saved"}
        </span>
        <button
          type="submit"
          disabled={status === "saving"}
          data-save
          className="rounded-lg bg-qc px-6 py-2.5 font-medium text-on-qc transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
