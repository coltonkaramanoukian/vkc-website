import { after } from "next/server";
import { Resend } from "resend";
import { containerFamilies } from "@/lib/content";
import { pricing } from "@/lib/estimator/pricing";
import { buildLeadSummary } from "@/lib/estimator/summary";
import { composeQuoteEmail } from "@/lib/quote/email";
import {
  forwardConfigFromEnv,
  forwardLead,
  resolveLeadResponse,
  type ForwardOutcome,
} from "@/lib/quote/forward";
import { clientIp, createRateLimiter } from "@/lib/quote/rate-limit";
import { isHoneypotFilled, validateQuote, type QuoteRequest } from "@/lib/quote/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// D6: 5 requests per minute per IP, per instance (a speed bump, not a guarantee).
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const CONTAINER_IDS = containerFamilies.map((family) => family.id);

// How long a FAILED/unconfigured email will wait on the forward to rescue the
// submit before responding anyway and finishing the forward in the background.
// Keeps the user unblocked (fire-and-forget) while preserving "success if either".
const FORWARD_GRACE_MS = 2500;

type Outcome =
  | "sent"
  | "honeypot"
  | "invalid"
  | "rate_limited"
  | "email_not_configured"
  | "send_failed"
  | "bad_request"
  | "vcm_forwarded"
  | "vcm_failed"
  | "vcm_skipped";

// English labels for the estimate block in the (internal) notification email.
const EMAIL_ESTIMATE_LABELS = {
  heading: "Estimate (from the online estimator)",
  service: "Service",
  amount: "Amount",
  addons: "Add-ons",
  range: "Ballpark range",
  placeholder: "placeholder rates",
} as const;

/**
 * Rebuild the estimator's human-readable summary from the structured estimate,
 * for the email only. Pure pricing data (names, labels) — never the customer's
 * own words, which stay in `notes`. Returns null when the lead has no estimate.
 */
function estimateSummaryFor(data: QuoteRequest): string | null {
  if (!data.estimate) return null;
  const { estimate } = data;
  return buildLeadSummary({
    config: pricing,
    serviceId: estimate.serviceId,
    quantity: estimate.quantity,
    optionIds: estimate.optionIds,
    result: {
      ok: true,
      low: estimate.low,
      high: estimate.high,
      point: estimate.low,
      currency: estimate.currency,
      placeholder: estimate.placeholder,
    },
    locale: data.locale,
    labels: EMAIL_ESTIMATE_LABELS,
  });
}

/** Log the VCM forward outcome with the no-PII logAttempt shape. */
function logForward(outcome: ForwardOutcome | null, source: string) {
  if (outcome === null) {
    logAttempt("vcm_skipped", { source });
  } else if (outcome.ok) {
    logAttempt("vcm_forwarded", { source, status: outcome.status, attempts: outcome.attempts });
  } else {
    logAttempt("vcm_failed", { source, status: outcome.status, attempts: outcome.attempts, reason: outcome.reason });
  }
}

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

  // Secondary sink: forward to VCM concurrently with the email. It never throws
  // and never blocks the user's result beyond its own 5s-per-attempt budget; a
  // VCM outage leaves the email as the durable capture (see resolveLeadResponse).
  const forwardConfig = forwardConfigFromEnv();
  const forwardPromise: Promise<ForwardOutcome | null> = forwardConfig
    ? forwardLead(data, forwardConfig).catch((error) => ({
        ok: false as const,
        status: 0,
        submissionId: "",
        attempts: 0,
        reason: error instanceof Error ? error.name : "unknown",
      }))
    : Promise.resolve(null);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_TO_EMAIL;
  const from = process.env.QUOTE_FROM_EMAIL;
  const missing = [
    !apiKey && "RESEND_API_KEY",
    !to && "QUOTE_TO_EMAIL",
    !from && "QUOTE_FROM_EMAIL",
  ].filter(Boolean);
  const emailConfigured = missing.length === 0 && !!apiKey && !!to && !!from;

  let emailOk = false;
  if (!emailConfigured) {
    logAttempt("email_not_configured", { missing, source: data.source, service: data.service });
  } else {
    const email = composeQuoteEmail(
      data,
      (id) => {
        const family = containerFamilies.find((f) => f.id === id);
        return family ? family.name.en : id;
      },
      estimateSummaryFor(data),
    );
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
      } else {
        emailOk = true;
        logAttempt("sent", { source: data.source, service: data.service, id: sent.id });
      }
    } catch (error) {
      logAttempt("send_failed", {
        source: data.source,
        reason: error instanceof Error ? error.name : "unknown",
      });
    }
  }

  // Reconcile WITHOUT blocking the user on a slow VCM (fire-and-forget). If the
  // email already carried the lead, respond now and finish the forward after the
  // response. Otherwise give the forward a brief grace to rescue the submit, then
  // detach it. Either way the forward always completes (inline or via after()).
  let forwardOk = false;
  if (emailOk) {
    after(async () => logForward(await forwardPromise, data.source));
  } else {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const grace = new Promise<"grace">((resolve) => {
      timer = setTimeout(() => resolve("grace"), FORWARD_GRACE_MS);
    });
    const settled = await Promise.race([forwardPromise, grace]);
    if (timer) clearTimeout(timer);
    if (settled === "grace") {
      after(async () => logForward(await forwardPromise, data.source));
    } else {
      logForward(settled, data.source);
      forwardOk = settled?.ok ?? false;
    }
  }

  const response = resolveLeadResponse(emailOk, emailConfigured, forwardOk);
  return json(response.status, response.code ? { ok: false, code: response.code } : { ok: true });
}
