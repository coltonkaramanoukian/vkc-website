// Website → VCM lead forward (WEBSITE_LEAD_INTAKE.md). After a lead validates,
// /api/quote ALSO forwards it to VCM's ingestion endpoint, signed with a shared
// secret. It is a secondary sink: the email stays the primary, durable capture,
// so a forward that fails NEVER fails the user's submit (see route.ts).
//
// The signer here is byte-for-byte compatible with VCM's verifier — proven in
// forward.test.ts against the shared SIGNATURE_VECTOR from VCM's
// core/tests_website_intake.py. Pure parts (payload build, signer, response
// reconciliation) are split out so they can be unit-tested without a network.

import { createHmac, randomUUID } from "node:crypto";
import type { QuoteRequest } from "./validate.ts";

/** The payload schema version VCM expects. A mismatch is a 400 on their side. */
export const WEBSITE_LEAD_SCHEMA = "vkc.website-lead/1" as const;

/** Per-attempt network budget. Two attempts → ~double this in the worst case. */
export const FORWARD_TIMEOUT_MS = 5000;

export interface ForwardConfig {
  url: string;
  secret: string;
}

/**
 * The forward config, or null to SKIP forwarding (today's behaviour before the
 * integration). Null unless BOTH env vars are present and non-blank — so the
 * code is safe to ship before the secret exists, and Preview deploys (which
 * leave the vars unset) never write to the live CRM.
 */
export function forwardConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): ForwardConfig | null {
  const url = env.VCM_INTAKE_URL?.trim();
  const secret = env.WEBSITE_INTAKE_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

export interface WebsiteLeadEstimate {
  service_id: string;
  quantity: number;
  unit: string;
  option_ids: string[];
  low: number;
  high: number;
  currency: string;
  placeholder: boolean;
}

/** The `vkc.website-lead/1` wire shape (snake_case, as VCM validates it). */
export interface WebsiteLeadPayload {
  schema: typeof WEBSITE_LEAD_SCHEMA;
  submission_id: string;
  submitted_at: string;
  source: QuoteRequest["source"];
  locale: QuoteRequest["locale"];
  company: string;
  name: string;
  email: string | null;
  phone: string | null;
  service: QuoteRequest["service"];
  shift: string | null;
  product: string | null;
  viscosity: string | null;
  container: string | null;
  units: string | null;
  timeline: string | null;
  notes: string | null;
  estimate: WebsiteLeadEstimate | null;
  page_path: string | null;
}

export interface PayloadMeta {
  /** UUID v4, generated once per submit — VCM's idempotency key. */
  submissionId: string;
  /** ISO-8601, the website clock. */
  submittedAt: string;
}

/** Pure: a validated QuoteRequest + its ids → the exact shape VCM expects. */
export function buildWebsiteLeadPayload(request: QuoteRequest, meta: PayloadMeta): WebsiteLeadPayload {
  return {
    schema: WEBSITE_LEAD_SCHEMA,
    submission_id: meta.submissionId,
    submitted_at: meta.submittedAt,
    source: request.source,
    locale: request.locale,
    company: request.company,
    name: request.name,
    email: request.email,
    phone: request.phone,
    service: request.service,
    shift: request.shift,
    product: request.product,
    viscosity: request.viscosity,
    container: request.container,
    units: request.units,
    timeline: request.timeline,
    notes: request.notes,
    estimate: request.estimate
      ? {
          service_id: request.estimate.serviceId,
          quantity: request.estimate.quantity,
          unit: request.estimate.unit,
          option_ids: request.estimate.optionIds,
          low: request.estimate.low,
          high: request.estimate.high,
          currency: request.estimate.currency,
          placeholder: request.estimate.placeholder,
        }
      : null,
    page_path: request.pagePath,
  };
}

/**
 * Pure: the `X-VKC-Signature` header value for a body. Matches VCM's verifier —
 * `v1 = hex(HMAC_SHA256(secret, `${t}.${body}`))`, t in unix seconds.
 */
export function signBody(secret: string, body: string, timestampSeconds: number): string {
  const v1 = createHmac("sha256", secret).update(`${timestampSeconds}.${body}`).digest("hex");
  return `t=${timestampSeconds},v1=${v1}`;
}

export type ForwardOutcome =
  | { ok: true; status: number; submissionId: string; attempts: number }
  | { ok: false; status: number; submissionId: string; attempts: number; reason: string };

export interface ForwardDeps {
  fetch?: typeof fetch;
  /** Wall clock in ms. Injected for tests. */
  now?: () => number;
  /** UUID generator. Injected for tests. */
  randomId?: () => string;
  timeoutMs?: number;
}

/** 5xx and 429 are transient; a 4xx is the sender's fault and is never retried. */
const isRetryableStatus = (status: number): boolean => status >= 500 || status === 429;

/**
 * Forward a validated lead to VCM. NEVER throws. Retries exactly ONCE on a
 * network error / 5xx / 429 — same `submission_id` (idempotent), fresh
 * timestamp — and never on a 4xx (per the contract's retry rule).
 */
export async function forwardLead(
  request: QuoteRequest,
  config: ForwardConfig,
  deps: ForwardDeps = {},
): Promise<ForwardOutcome> {
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? Date.now;
  const randomId = deps.randomId ?? randomUUID;
  const timeoutMs = deps.timeoutMs ?? FORWARD_TIMEOUT_MS;

  const submissionId = randomId();
  const submittedAt = new Date(now()).toISOString();
  // Signed and sent byte-for-byte; the same bytes are what VCM verifies.
  const body = JSON.stringify(buildWebsiteLeadPayload(request, { submissionId, submittedAt }));

  const MAX_ATTEMPTS = 2;
  let lastStatus = 0;
  let lastReason = "unknown";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const timestamp = Math.floor(now() / 1000);
    try {
      const response = await doFetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VKC-Signature": signBody(config.secret, body, timestamp),
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) {
        return { ok: true, status: response.status, submissionId, attempts: attempt };
      }
      lastStatus = response.status;
      lastReason = `http_${response.status}`;
      if (!isRetryableStatus(response.status)) {
        return { ok: false, status: response.status, submissionId, attempts: attempt, reason: lastReason };
      }
    } catch (error) {
      lastStatus = 0;
      lastReason = error instanceof Error ? error.name : "network_error";
    }
    // Retryable failure: loop once more if an attempt remains.
  }

  return { ok: false, status: lastStatus, submissionId, attempts: MAX_ATTEMPTS, reason: lastReason };
}

export interface LeadResponse {
  status: number;
  code?: string;
}

/**
 * Pure: the user-facing result, reconciling the two sinks. Success if EITHER
 * the email went out OR the VCM forward landed — the lead is durably captured
 * somewhere. Only when both fail does the user see the existing email error, so
 * a VCM outage never changes what the visitor sees.
 */
export function resolveLeadResponse(
  emailOk: boolean,
  emailConfigured: boolean,
  forwardOk: boolean,
): LeadResponse {
  if (emailOk || forwardOk) return { status: 200 };
  if (!emailConfigured) return { status: 503, code: "email_not_configured" };
  return { status: 502, code: "send_failed" };
}
