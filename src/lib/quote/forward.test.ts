import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  buildWebsiteLeadPayload,
  forwardConfigFromEnv,
  forwardLead,
  resolveLeadResponse,
  signBody,
  WEBSITE_LEAD_SCHEMA,
} from "./forward.ts";
import type { LeadEstimate, QuoteRequest } from "./validate.ts";

// Shared with VCM's core/tests_website_intake.py SIGNATURE_VECTOR. The same
// inputs MUST produce the same signature here, or signed forwards get a 401.
const SIGNATURE_VECTOR = {
  secret: "vector-secret",
  timestamp: 1760000000,
  body: '{"schema":"vkc.website-lead/1"}',
  signature: "88aae4bd4c5cfa975214112ed3a179ae0d16bb40ff1a2e7572d2d7e8bd07cbf0",
};

const ESTIMATE: LeadEstimate = {
  serviceId: "fill-only",
  quantity: 5000,
  unit: "units",
  optionIds: ["labels"],
  low: 1800,
  high: 2400,
  currency: "CAD",
  placeholder: true,
};

function makeRequest(overrides: Partial<QuoteRequest> = {}): QuoteRequest {
  return {
    source: "quote",
    locale: "fr",
    company: "Nettoyants Laval inc.",
    name: "Marie Tremblay",
    email: "marie@example.com",
    phone: null,
    service: "second-shift",
    shift: "evenings",
    product: "Degreaser concentrate",
    viscosity: "pourable",
    container: "jug-4l",
    units: "5000 units",
    timeline: "Next quarter",
    notes: "We need overflow for spring.",
    estimate: ESTIMATE,
    pagePath: "/fr/estimation",
    ...overrides,
  };
}

/** A minimal stub fetch that records calls and replays queued responses. */
function stubFetch(responses: Array<{ ok?: boolean; status: number } | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses[Math.min(i, responses.length - 1)];
    i += 1;
    if (next instanceof Error) throw next;
    return { ok: next.ok ?? next.status < 400, status: next.status } as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const CONFIG = { url: "https://vcm.example/api/v1/intake/website-lead/", secret: "a-test-secret-32-bytes-or-more-xx" };
const DEPS = (fetchImpl: typeof fetch) => ({
  fetch: fetchImpl,
  now: () => 1_760_000_000_000,
  randomId: () => "11111111-1111-4111-8111-111111111111",
  timeoutMs: 50,
});

describe("signBody", () => {
  it("matches the shared VCM signature vector byte-for-byte", () => {
    const header = signBody(SIGNATURE_VECTOR.secret, SIGNATURE_VECTOR.body, SIGNATURE_VECTOR.timestamp);
    assert.equal(header, `t=${SIGNATURE_VECTOR.timestamp},v1=${SIGNATURE_VECTOR.signature}`);
  });

  it("changes with the secret", () => {
    const a = signBody("one", SIGNATURE_VECTOR.body, SIGNATURE_VECTOR.timestamp);
    const b = signBody("two", SIGNATURE_VECTOR.body, SIGNATURE_VECTOR.timestamp);
    assert.notEqual(a, b);
  });
});

describe("buildWebsiteLeadPayload", () => {
  it("maps the request to the wire shape, estimate in snake_case", () => {
    const payload = buildWebsiteLeadPayload(makeRequest(), {
      submissionId: "abc",
      submittedAt: "2026-10-02T14:03:11Z",
    });
    assert.equal(payload.schema, WEBSITE_LEAD_SCHEMA);
    assert.equal(payload.submission_id, "abc");
    assert.equal(payload.submitted_at, "2026-10-02T14:03:11Z");
    assert.equal(payload.company, "Nettoyants Laval inc.");
    assert.equal(payload.page_path, "/fr/estimation");
    assert.deepEqual(payload.estimate, {
      service_id: "fill-only",
      quantity: 5000,
      unit: "units",
      option_ids: ["labels"],
      low: 1800,
      high: 2400,
      currency: "CAD",
      placeholder: true,
    });
  });

  it("carries a null estimate and null page_path through", () => {
    const payload = buildWebsiteLeadPayload(makeRequest({ estimate: null, pagePath: null }), {
      submissionId: "x",
      submittedAt: "t",
    });
    assert.equal(payload.estimate, null);
    assert.equal(payload.page_path, null);
  });
});

describe("resolveLeadResponse", () => {
  it("is 200 when the email went out, whatever VCM did", () => {
    assert.deepEqual(resolveLeadResponse(true, true, false), { status: 200 });
  });

  it("is 200 when the forward landed even if the email failed or is unconfigured", () => {
    assert.deepEqual(resolveLeadResponse(false, true, true), { status: 200 });
    assert.deepEqual(resolveLeadResponse(false, false, true), { status: 200 });
  });

  it("falls back to the existing email error only when both failed", () => {
    assert.deepEqual(resolveLeadResponse(false, false, false), { status: 503, code: "email_not_configured" });
    assert.deepEqual(resolveLeadResponse(false, true, false), { status: 502, code: "send_failed" });
  });
});

describe("forwardConfigFromEnv", () => {
  it("returns a config only when both vars are present and non-blank", () => {
    assert.deepEqual(forwardConfigFromEnv({ VCM_INTAKE_URL: "https://x/", WEBSITE_INTAKE_SECRET: "s" }), {
      url: "https://x/",
      secret: "s",
    });
    assert.equal(forwardConfigFromEnv({ VCM_INTAKE_URL: "https://x/" }), null);
    assert.equal(forwardConfigFromEnv({ WEBSITE_INTAKE_SECRET: "s" }), null);
    assert.equal(forwardConfigFromEnv({ VCM_INTAKE_URL: "  ", WEBSITE_INTAKE_SECRET: "s" }), null);
    assert.equal(forwardConfigFromEnv({}), null);
  });
});

describe("forwardLead", () => {
  it("signs the exact body it sends and reports success on 201", async () => {
    const { fetchImpl, calls } = stubFetch([{ status: 201 }]);
    const outcome = await forwardLead(makeRequest(), CONFIG, DEPS(fetchImpl));

    assert.equal(outcome.ok, true);
    assert.equal(outcome.status, 201);
    assert.equal(outcome.attempts, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, CONFIG.url);

    // The signature must verify against the exact bytes sent.
    const body = calls[0].init.body as string;
    const header = (calls[0].init.headers as Record<string, string>)["X-VKC-Signature"];
    const match = /^t=(\d+),v1=([0-9a-f]+)$/.exec(header);
    assert.ok(match, "header is well-formed");
    const expected = createHmac("sha256", CONFIG.secret).update(`${match[1]}.${body}`).digest("hex");
    assert.equal(match[2], expected);
    // The signed submission_id is the idempotency key.
    assert.equal(JSON.parse(body).submission_id, "11111111-1111-4111-8111-111111111111");
  });

  it("does NOT retry a 4xx", async () => {
    const { fetchImpl, calls } = stubFetch([{ status: 400 }, { status: 201 }]);
    const outcome = await forwardLead(makeRequest(), CONFIG, DEPS(fetchImpl));
    assert.equal(outcome.ok, false);
    assert.equal(outcome.attempts, 1);
    assert.equal(calls.length, 1);
  });

  it("retries once on a 5xx, then succeeds, reusing the submission_id", async () => {
    const { fetchImpl, calls } = stubFetch([{ status: 503 }, { status: 201 }]);
    const outcome = await forwardLead(makeRequest(), CONFIG, DEPS(fetchImpl));
    assert.equal(outcome.ok, true);
    assert.equal(outcome.attempts, 2);
    assert.equal(calls.length, 2);
    const first = JSON.parse(calls[0].init.body as string).submission_id;
    const second = JSON.parse(calls[1].init.body as string).submission_id;
    assert.equal(first, second);
  });

  it("retries once on 429 then gives up, never throwing", async () => {
    const { fetchImpl, calls } = stubFetch([{ status: 429 }, { status: 429 }]);
    const outcome = await forwardLead(makeRequest(), CONFIG, DEPS(fetchImpl));
    assert.equal(outcome.ok, false);
    assert.equal(outcome.attempts, 2);
    assert.equal(calls.length, 2);
  });

  it("retries once on a network error, then succeeds", async () => {
    const { fetchImpl, calls } = stubFetch([new Error("boom"), { status: 201 }]);
    const outcome = await forwardLead(makeRequest(), CONFIG, DEPS(fetchImpl));
    assert.equal(outcome.ok, true);
    assert.equal(outcome.attempts, 2);
    assert.equal(calls.length, 2);
  });

  it("reports failure (status 0) when the network fails twice", async () => {
    const { fetchImpl } = stubFetch([new Error("down"), new Error("down")]);
    const outcome = await forwardLead(makeRequest(), CONFIG, DEPS(fetchImpl));
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, 0);
    assert.equal(outcome.attempts, 2);
  });

  it("is bounded by its per-attempt timeout and never hangs on a stalled VCM", async () => {
    // A VCM that accepts the connection then stalls: the only way to the ~10s
    // worst case. The AbortSignal.timeout must fire, aborting each attempt.
    const hanging = (async (_url: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("timed out", "TimeoutError")));
      })) as unknown as typeof fetch;
    const start = Date.now();
    const outcome = await forwardLead(makeRequest(), CONFIG, {
      fetch: hanging,
      randomId: () => "11111111-1111-4111-8111-111111111111",
      timeoutMs: 30,
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.attempts, 2); // aborted, retried once, gave up
    assert.ok(Date.now() - start < 1000, "returned promptly rather than hanging");
  });
});
