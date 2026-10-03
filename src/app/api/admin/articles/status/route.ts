import { NextResponse } from "next/server";
import { setArticleStatus } from "@/lib/admin/articles";
import { isSameOrigin, requireAdmin } from "@/lib/admin/request";
import { persistenceMode, readCollectionCurrent, writeSection } from "@/lib/admin/store";
import type { Article, ArticleStatus } from "@/lib/blog/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json(403, { ok: false, code: "forbidden" });
  if (!(await requireAdmin(request))) return json(401, { ok: false, code: "unauthorized" });

  let slug = "";
  let status: ArticleStatus = "draft";
  try {
    const body = (await request.json()) as { slug?: unknown; status?: unknown };
    if (typeof body.slug === "string") slug = body.slug;
    status = body.status === "published" ? "published" : "draft";
  } catch {
    return json(400, { ok: false, code: "bad_request" });
  }
  if (!slug) return json(400, { ok: false, code: "bad_request" });
  if (persistenceMode() === "none") return json(503, { ok: false, code: "not_configured" });

  try {
    const list = (await readCollectionCurrent("articles")) as Article[];
    if (!list.some((a) => a.slug === slug)) return json(404, { ok: false, code: "not_found" });
    await writeSection("articles", setArticleStatus(list, slug, status));
    console.log(JSON.stringify({ event: "admin_article_status", outcome: "updated", slug, status }));
    return json(200, { ok: true, status });
  } catch (error) {
    console.error(JSON.stringify({ event: "admin_article_status", outcome: "write_failed", reason: error instanceof Error ? error.message : "unknown" }));
    return json(502, { ok: false, code: "write_failed" });
  }
}
