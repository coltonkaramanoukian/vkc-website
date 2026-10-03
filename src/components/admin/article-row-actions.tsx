"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArticleStatus } from "@/lib/blog/articles";

export function ArticleRowActions({ slug, status }: { slug: string; status: ArticleStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next: ArticleStatus = status === "published" ? "draft" : "published";
      const response = await fetch("/api/admin/articles/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, status: next }),
      });
      if (response.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="rounded-md border border-hairline px-3 py-1 text-xs text-graphite transition hover:text-ink disabled:opacity-60"
    >
      {busy ? "…" : status === "published" ? "Unpublish" : "Publish"}
    </button>
  );
}
