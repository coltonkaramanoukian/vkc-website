import { NextResponse } from "next/server";
import { removeArticle } from "@/lib/admin/articles";
import { isSameOrigin, requireAdmin } from "@/lib/admin/request";
import { persistenceMode, readCollectionCurrent, writeSection } from "@/lib/admin/store";
import type { Article } from "@/lib/blog/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json(403, { ok: false, code: "forbidden" });
  if (!(await requireAdmin(request))) return json(401, { ok: false, code: "unauthorized" });

  let slug = "";
  try {
    const body = (await request.json()) as { slug?: unknown };
    if (typeof body.slug === "string") slug = body.slug;
  } catch {
    return json(400, { ok: false, code: "bad_request" });
  }
  if (!slug) return json(400, { ok: false, code: "bad_request" });
  if (persistenceMode() === "none") return json(503, { ok: false, code: "not_configured" });

  try {
    const list = (await readCollectionCurrent("articles")) as Article[];
    await writeSection("articles", removeArticle(list, slug));
    console.log(JSON.stringify({ event: "admin_article_delete", outcome: "deleted", slug }));
    return json(200, { ok: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "admin_article_delete", outcome: "write_failed", reason: error instanceof Error ? error.message : "unknown" }));
    return json(502, { ok: false, code: "write_failed" });
  }
}
