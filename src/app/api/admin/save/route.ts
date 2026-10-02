import { NextResponse } from "next/server";
import { isSameOrigin, requireAdmin } from "@/lib/admin/request";
import { getSection } from "@/lib/admin/sections";
import { persistenceMode, writeSection } from "@/lib/admin/store";
import { prepareSection } from "@/lib/admin/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function log(outcome: string, detail: Record<string, unknown> = {}) {
  const line = JSON.stringify({ event: "admin_save", outcome, ...detail });
  if (outcome === "write_failed") console.error(line);
  else console.log(line);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    log("cross_origin");
    return json(403, { ok: false, code: "forbidden" });
  }
  if (!(await requireAdmin(request))) {
    log("unauthorized");
    return json(401, { ok: false, code: "unauthorized" });
  }

  let payload: { section?: unknown; data?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json(400, { ok: false, code: "bad_request" });
  }

  const section = typeof payload.section === "string" ? getSection(payload.section) : undefined;
  if (!section) {
    log("unknown_section", { section: payload.section });
    return json(400, { ok: false, code: "unknown_section" });
  }

  const prepared = prepareSection(section, payload.data);
  if (!prepared.ok) {
    log("invalid", { section: section.id, errors: prepared.errors.length });
    return json(422, { ok: false, code: "invalid", errors: prepared.errors });
  }

  if (persistenceMode() === "none") {
    log("not_configured", { section: section.id });
    return json(503, { ok: false, code: "not_configured" });
  }

  try {
    await writeSection(section.file, prepared.content);
    log("saved", { section: section.id, mode: persistenceMode() });
    return json(200, { ok: true, mode: persistenceMode() });
  } catch (error) {
    log("write_failed", { section: section.id, reason: error instanceof Error ? error.message : "unknown" });
    return json(502, { ok: false, code: "write_failed" });
  }
}
