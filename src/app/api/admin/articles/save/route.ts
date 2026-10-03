import { NextResponse } from "next/server";
import { prepareArticle, upsertArticle } from "@/lib/admin/articles";
import { isSameOrigin, requireAdmin } from "@/lib/admin/request";
import { persistenceMode, readCollectionCurrent, writeSection } from "@/lib/admin/store";
import type { Article } from "@/lib/blog/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function log(outcome: string, detail: Record<string, unknown> = {}) {
  const line = JSON.stringify({ event: "admin_article_save", outcome, ...detail });
  if (outcome === "write_failed") console.error(line);
  else console.log(line);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json(403, { ok: false, code: "forbidden" });
  if (!(await requireAdmin(request))) return json(401, { ok: false, code: "unauthorized" });

  let payload: { article?: unknown; originalSlug?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json(400, { ok: false, code: "bad_request" });
  }

  const prepared = prepareArticle(payload.article);
  if (!prepared.ok || !prepared.article) {
    log("invalid", { errors: prepared.errors.length });
    return json(422, { ok: false, code: "invalid", errors: prepared.errors });
  }

  if (persistenceMode() === "none") {
    log("not_configured");
    return json(503, { ok: false, code: "not_configured" });
  }

  try {
    const list = (await readCollectionCurrent("articles")) as Article[];
    const originalSlug = typeof payload.originalSlug === "string" ? payload.originalSlug : undefined;
    const result = upsertArticle(list, prepared.article, originalSlug);
    if (!result.ok || !result.list) {
      return json(422, { ok: false, code: "invalid", errors: [{ path: "slug", message: result.error }] });
    }
    await writeSection("articles", result.list);
    log("saved", { slug: prepared.article.slug, status: prepared.article.status, mode: persistenceMode() });
    return json(200, { ok: true, slug: prepared.article.slug });
  } catch (error) {
    log("write_failed", { reason: error instanceof Error ? error.message : "unknown" });
    return json(502, { ok: false, code: "write_failed" });
  }
}
