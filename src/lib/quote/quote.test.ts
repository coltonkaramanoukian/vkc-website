import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { negotiateLocale } from "../accept-language.ts";
import { composeQuoteEmail } from "./email.ts";
import { clientIp, createRateLimiter } from "./rate-limit.ts";
import { isHoneypotFilled, validateQuote } from "./validate.ts";

const CONTAINERS = ["hdpe-bottle-1l", "plastic-pail-5g"];

const full = {
  source: "quote",
  locale: "en",
  company: "Acme Coatings",
  name: "Sam",
  email: "sam@example.com",
  phone: "",
  service: "second-shift",
  shift: "nights",
  product: "acrylic sealer",
  viscosity: "thick",
  container: "plastic-pail-5g",
  units: "a few thousand",
  timeline: "next month",
  notes: "",
};

describe("validateQuote", () => {
  it("accepts a complete full-mode request", () => {
    const result = validateQuote(full, CONTAINERS);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.shift, "nights");
      assert.equal(result.data.phone, null);
    }
  });

  it("requires company, name, a service, and a phone or email", () => {
    const result = validateQuote({ source: "quote" }, CONTAINERS);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.errors, {
        company: "required",
        name: "required",
        email: "contact",
        service: "choice",
      });
    }
  });

  it("reads the short-mode contact field as email or phone", () => {
    const asPhone = validateQuote(
      { source: "visit", company: "A", name: "B", contact: "514 000 0000", service: "unsure" },
      CONTAINERS,
    );
    assert.ok(asPhone.ok && asPhone.data.phone === "514 000 0000" && asPhone.data.email === null);
    const badEmail = validateQuote(
      { source: "visit", company: "A", name: "B", contact: "not@valid", service: "unsure" },
      CONTAINERS,
    );
    assert.ok(!badEmail.ok && badEmail.errors.contact === "email");
  });

  it("rejects options that are not on the form", () => {
    const result = validateQuote(
      { ...full, service: "labour", viscosity: "gas", container: "drum" },
      CONTAINERS,
    );
    assert.ok(!result.ok);
    if (!result.ok) {
      assert.equal(result.errors.service, "choice");
      assert.equal(result.errors.viscosity, "choice");
      assert.equal(result.errors.container, "choice");
    }
  });

  it("drops the shift unless the service is Second Shift", () => {
    const result = validateQuote({ ...full, service: "bottleneck" }, CONTAINERS);
    assert.ok(result.ok && result.data.shift === null);
  });

  it("detects a filled honeypot", () => {
    assert.equal(isHoneypotFilled({ website: "http://spam" }), true);
    assert.equal(isHoneypotFilled({ website: "" }), false);
  });

  it("has a null estimate and null page path by default", () => {
    const result = validateQuote(full, CONTAINERS);
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.data.estimate, null);
      assert.equal(result.data.pagePath, null);
    }
  });
});

const ESTIMATE = {
  serviceId: "fill-only",
  quantity: 5000,
  unit: "units",
  optionIds: ["labels"],
  low: 1800,
  high: 2400,
  currency: "CAD",
  placeholder: true,
};

describe("validateQuote estimate + page path", () => {
  it("accepts and passes through a well-formed estimate", () => {
    const result = validateQuote({ ...full, estimate: ESTIMATE, page_path: "/en/estimate" }, CONTAINERS);
    assert.ok(result.ok);
    if (result.ok) {
      assert.deepEqual(result.data.estimate, ESTIMATE);
      assert.equal(result.data.pagePath, "/en/estimate");
    }
  });

  it("rejects a non-object estimate", () => {
    const result = validateQuote({ ...full, estimate: "1800-2400" }, CONTAINERS);
    assert.ok(!result.ok && result.errors.estimate === "choice");
  });

  it("rejects non-finite, negative, or boolean numbers", () => {
    for (const bad of [{ low: -1 }, { high: Infinity }, { quantity: "lots" }, { low: true }]) {
      const result = validateQuote({ ...full, estimate: { ...ESTIMATE, ...bad } }, CONTAINERS);
      assert.ok(!result.ok && result.errors.estimate === "choice", JSON.stringify(bad));
    }
  });

  it("rejects low above high", () => {
    const result = validateQuote({ ...full, estimate: { ...ESTIMATE, low: 3000, high: 2000 } }, CONTAINERS);
    assert.ok(!result.ok && result.errors.estimate === "choice");
  });

  it("rejects more than twenty option ids, or an overlong id", () => {
    const tooMany = validateQuote({ ...full, estimate: { ...ESTIMATE, optionIds: Array(21).fill("x") } }, CONTAINERS);
    assert.ok(!tooMany.ok && tooMany.errors.estimate === "choice");
    const tooLong = validateQuote({ ...full, estimate: { ...ESTIMATE, optionIds: ["x".repeat(65)] } }, CONTAINERS);
    assert.ok(!tooLong.ok && tooLong.errors.estimate === "choice");
  });

  it("drops an over-long page path rather than failing the lead", () => {
    const result = validateQuote({ ...full, page_path: "/" + "x".repeat(400) }, CONTAINERS);
    assert.ok(result.ok && result.data.pagePath === null);
  });
});

describe("composeQuoteEmail", () => {
  it("leads with source=visit and omits empty fields", () => {
    const result = validateQuote(
      { source: "visit", locale: "fr", company: "A", name: "B", contact: "a@b.co", service: "unsure", notes: "hi" },
      CONTAINERS,
    );
    assert.ok(result.ok);
    if (result.ok) {
      const email = composeQuoteEmail(result.data, (id) => id);
      assert.ok(email.text.startsWith("source=visit locale=fr"));
      assert.ok(!email.text.includes("Units per run"));
      assert.equal(email.replyTo, "a@b.co");
    }
  });
});

describe("composeQuoteEmail with an estimate summary", () => {
  it("includes the summary block and keeps notes separate", () => {
    const result = validateQuote(
      { ...full, notes: "Spring overflow.", estimate: ESTIMATE },
      CONTAINERS,
    );
    assert.ok(result.ok);
    if (result.ok) {
      const email = composeQuoteEmail(result.data, (id) => id, "Estimate: a ballpark");
      assert.ok(email.text.includes("Estimate: a ballpark"));
      assert.ok(email.text.includes("Notes:"));
      assert.ok(email.text.includes("Spring overflow."));
    }
  });
});

describe("composeQuoteEmail (contact page)", () => {
  it("labels a contact-page message as a message, not a quote request, and routes its source", () => {
    const result = validateQuote({ source: "contact", locale: "fr", company: "Acme", name: "Sam", contact: "sam@example.com", service: "unsure" }, CONTAINERS);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const email = composeQuoteEmail(result.data, (id) => id);
    assert.equal(email.subject, "Message: Acme (Not sure yet, contact page)");
    assert.equal(email.text.split("\n")[0], "source=contact locale=fr");
    assert.equal(email.replyTo, "sam@example.com");
  });
});

describe("rate limiter", () => {
  it("allows five per minute per key, then refuses until the window passes", () => {
    let clock = 0;
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, now: () => clock });
    for (let i = 0; i < 5; i += 1) assert.equal(limiter.check("1.2.3.4").allowed, true);
    const sixth = limiter.check("1.2.3.4");
    assert.equal(sixth.allowed, false);
    assert.ok(sixth.retryAfterSeconds > 0);
    assert.equal(limiter.check("5.6.7.8").allowed, true);
    clock = 60_001;
    assert.equal(limiter.check("1.2.3.4").allowed, true);
  });

  it("reads the client IP from Vercel headers", () => {
    assert.equal(clientIp(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })), "9.9.9.9");
    assert.equal(clientIp(new Headers({ "x-real-ip": "8.8.8.8" })), "8.8.8.8");
    assert.equal(clientIp(new Headers()), "unknown");
  });
});

describe("negotiateLocale", () => {
  it("follows Accept-Language and falls back to fr", () => {
    assert.equal(negotiateLocale("en"), "en");
    assert.equal(negotiateLocale("fr-CA,fr;q=0.9,en;q=0.8"), "fr");
    assert.equal(negotiateLocale("en-US,en;q=0.9,fr;q=0.8"), "en");
    assert.equal(negotiateLocale("de-DE,en;q=0.5"), "en");
    assert.equal(negotiateLocale("de-DE"), "fr");
    assert.equal(negotiateLocale(null), "fr");
    assert.equal(negotiateLocale("fr;q=0.4,en;q=0.9"), "en");
  });
});
