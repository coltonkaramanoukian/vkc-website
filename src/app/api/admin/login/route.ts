import { NextResponse } from "next/server";
import { clientIp, createRateLimiter } from "@/lib/quote/rate-limit";
import { isSameOrigin } from "@/lib/admin/request";
import { adminConfigured, createSessionToken, sessionCookie, verifyPassword } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Brute-force speed bump: 10 attempts / 5 min / IP, per instance (see rate-limit.ts).
const limiter = createRateLimiter({ limit: 10, windowMs: 5 * 60_000 });

function json(status: number, body: Record<string, unknown>, headers: HeadersInit = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function log(outcome: string, detail: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event: "admin_login", outcome, ...detail }));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    log("cross_origin");
    return json(403, { ok: false, code: "forbidden" });
  }
  if (!adminConfigured()) {
    log("not_configured");
    return json(403, { ok: false, code: "not_configured" });
  }

  const decision = limiter.check(clientIp(request.headers));
  if (!decision.allowed) {
    log("rate_limited");
    return json(429, { ok: false, code: "rate_limited" }, { "Retry-After": String(decision.retryAfterSeconds) });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    return json(400, { ok: false, code: "bad_request" });
  }

  if (!(await verifyPassword(password))) {
    log("denied");
    return json(401, { ok: false, code: "invalid" });
  }

  const token = await createSessionToken();
  if (!token) {
    log("not_configured");
    return json(403, { ok: false, code: "not_configured" });
  }

  log("granted");
  const response = json(200, { ok: true });
  response.cookies.set(sessionCookie(token));
  return response;
}
