import { NextResponse } from "next/server";
import { preparePricing } from "@/lib/admin/pricing";
import { isSameOrigin, requireAdmin } from "@/lib/admin/request";
import { persistenceMode, writeSection } from "@/lib/admin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function log(outcome: string, detail: Record<string, unknown> = {}) {
  const line = JSON.stringify({ event: "admin_pricing_save", outcome, ...detail });
  if (outcome === "write_failed") console.error(line);
  else console.log(line);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json(403, { ok: false, code: "forbidden" });
  if (!(await requireAdmin(request))) return json(401, { ok: false, code: "unauthorized" });

  let payload: { pricing?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json(400, { ok: false, code: "bad_request" });
  }

  const prepared = preparePricing(payload.pricing);
  if (!prepared.ok || !prepared.pricing) {
    log("invalid", { errors: prepared.errors.length });
    return json(422, { ok: false, code: "invalid", errors: prepared.errors });
  }

  if (persistenceMode() === "none") {
    log("not_configured");
    return json(503, { ok: false, code: "not_configured" });
  }

  try {
    await writeSection("pricing", prepared.pricing);
    log("saved", { services: prepared.pricing.services.length, placeholder: prepared.pricing.placeholder, mode: persistenceMode() });
    return json(200, { ok: true });
  } catch (error) {
    log("write_failed", { reason: error instanceof Error ? error.message : "unknown" });
    return json(502, { ok: false, code: "write_failed" });
  }
}
