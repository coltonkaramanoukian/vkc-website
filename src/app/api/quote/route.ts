import { Resend } from "resend";
import { containerFamilies } from "@/lib/content";
import { composeQuoteEmail } from "@/lib/quote/email";
import { clientIp, createRateLimiter } from "@/lib/quote/rate-limit";
import { isHoneypotFilled, validateQuote } from "@/lib/quote/validate";

export const dynamic = "force-dynamic";

// D6: 5 requests per minute per IP, per instance (a speed bump, not a guarantee).
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const CONTAINER_IDS = containerFamilies.map((family) => family.id);

type Outcome =
  | "sent"
  | "honeypot"
  | "invalid"
  | "rate_limited"
  | "email_not_configured"
  | "send_failed"
  | "bad_request";

/** One structured line per attempt. No personal information is logged. */
function logAttempt(outcome: Outcome, detail: Record<string, unknown> = {}) {
  const line = JSON.stringify({ event: "quote", outcome, ...detail });
  if (outcome === "send_failed" || outcome === "bad_request") console.error(line);
  else console.log(line);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body: unknown = await request.json();
      return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    }
    if (type.includes("form")) {
      return Object.fromEntries((await request.formData()).entries());
    }
  } catch {
    return null;
  }
  return null;
}

function json(status: number, body: Record<string, unknown>, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request: Request) {
  const decision = limiter.check(clientIp(request.headers));
  if (!decision.allowed) {
    logAttempt("rate_limited");
    return json(
      429,
      { ok: false, code: "rate_limited" },
      { "Retry-After": String(decision.retryAfterSeconds) },
    );
  }

  const raw = await readBody(request);
  if (!raw) {
    logAttempt("bad_request");
    return json(400, { ok: false, code: "bad_request" });
  }

  if (isHoneypotFilled(raw)) {
    // Looks like success to the bot; nothing is sent.
    logAttempt("honeypot", { source: raw.source === "visit" ? "visit" : "quote" });
    return json(200, { ok: true });
  }

  const result = validateQuote(raw, CONTAINER_IDS);
  if (!result.ok) {
    logAttempt("invalid", { fields: Object.keys(result.errors) });
    return json(400, { ok: false, code: "invalid", errors: result.errors });
  }

  const { data } = result;
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_TO_EMAIL;
  const from = process.env.QUOTE_FROM_EMAIL;
  const missing = [
    !apiKey && "RESEND_API_KEY",
    !to && "QUOTE_TO_EMAIL",
    !from && "QUOTE_FROM_EMAIL",
  ].filter(Boolean);

  if (missing.length > 0 || !apiKey || !to || !from) {
    // Never a silent success: the UI shows "email not configured, call us".
    logAttempt("email_not_configured", { missing, source: data.source, service: data.service });
    return json(503, { ok: false, code: "email_not_configured" });
  }

  const email = composeQuoteEmail(data, (id) => {
    const family = containerFamilies.find((f) => f.id === id);
    return family ? family.name.en : id;
  });

  try {
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from,
      to,
      subject: email.subject,
      text: email.text,
      ...(email.replyTo ? { replyTo: email.replyTo } : {}),
    });
    if (error || !sent) {
      logAttempt("send_failed", { source: data.source, reason: error?.name ?? "no_data" });
      return json(502, { ok: false, code: "send_failed" });
    }
    logAttempt("sent", { source: data.source, service: data.service, id: sent.id });
    return json(200, { ok: true });
  } catch (error) {
    logAttempt("send_failed", {
      source: data.source,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return json(502, { ok: false, code: "send_failed" });
  }
}
