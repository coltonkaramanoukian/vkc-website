// Server-side validation for the quote form (D6). Pure: no imports, no I/O.

export const SERVICES = ["second-shift", "bottleneck", "unsure"] as const;
export const SHIFTS = ["evenings", "nights", "weekends", "unsure"] as const;
export const VISCOSITIES = ["water-thin", "pourable", "thick", "paste", "unsure"] as const;
export const SOURCES = ["quote", "visit", "contact"] as const;
export const LOCALES = ["fr", "en"] as const;
export const CONTAINER_EXTRAS = ["other", "unsure"] as const;

export type ServiceChoice = (typeof SERVICES)[number];
export type ShiftChoice = (typeof SHIFTS)[number];
export type ViscosityChoice = (typeof VISCOSITIES)[number];
export type Source = (typeof SOURCES)[number];
export type FormLocale = (typeof LOCALES)[number];

export type ErrorCode = "required" | "email" | "contact" | "choice" | "length";

/**
 * The structured estimate the interactive estimator produces. It rides on the
 * QuoteRequest so /api/quote can forward it to VCM as typed fields and rebuild
 * the email's text summary from it (see lib/quote/forward.ts, email.ts).
 */
export interface LeadEstimate {
  serviceId: string;
  quantity: number;
  unit: string;
  optionIds: string[];
  low: number;
  high: number;
  currency: string;
  placeholder: boolean;
}

export interface QuoteRequest {
  source: Source;
  locale: FormLocale;
  company: string;
  name: string;
  email: string | null;
  phone: string | null;
  service: ServiceChoice;
  shift: ShiftChoice | null;
  product: string | null;
  viscosity: ViscosityChoice | null;
  container: string | null;
  units: string | null;
  timeline: string | null;
  notes: string | null;
  /** Present only for leads that came from the estimator; null otherwise. */
  estimate: LeadEstimate | null;
  /** The path the form was submitted from, for VCM. Nullable, ≤300. */
  pagePath: string | null;
}

export type ValidationResult =
  | { ok: true; data: QuoteRequest }
  | { ok: false; errors: Record<string, ErrorCode> };

const MAX = {
  company: 200,
  name: 200,
  email: 254,
  phone: 40,
  contact: 254,
  product: 200,
  units: 100,
  timeline: 200,
  notes: 4000,
} as const;

// Bounds for the structured estimate, mirroring what VCM re-validates so a
// well-formed estimate is never rejected on their side.
const ESTIMATE_MAX = { serviceId: 64, unit: 64, currency: 8, optionId: 64, options: 20 } as const;
const MAX_PAGE_PATH = 300;

// Deliberately permissive; the reply is by a human, not an automated mailer.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Raw = Record<string, unknown>;

function text(raw: Raw, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
}

function choice<T extends string>(value: string, options: readonly T[]): T | null {
  return (options as readonly string[]).includes(value) ? (value as T) : null;
}

/** True when the honeypot field carries anything at all. */
export function isHoneypotFilled(raw: Raw): boolean {
  return text(raw, "website") !== "";
}

/** A finite, non-negative number — and NOT a boolean (typeof excludes those). */
function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Validate the optional structured estimate. Absent/null is fine (not every
 * lead has one). When present it must be a well-formed object within bounds;
 * anything malformed is rejected rather than silently dropped, so a tampered or
 * buggy payload fails fast here instead of at VCM.
 */
function validateEstimate(value: unknown): { estimate: LeadEstimate | null; ok: boolean } {
  if (value === undefined || value === null) return { estimate: null, ok: true };
  if (typeof value !== "object" || Array.isArray(value)) return { estimate: null, ok: false };

  const raw = value as Raw;
  const serviceId = typeof raw.serviceId === "string" ? raw.serviceId.trim() : "";
  const unit = typeof raw.unit === "string" ? raw.unit.trim() : "";
  const currency = typeof raw.currency === "string" ? raw.currency.trim() : "";

  if (!serviceId || serviceId.length > ESTIMATE_MAX.serviceId) return { estimate: null, ok: false };
  if (unit.length > ESTIMATE_MAX.unit) return { estimate: null, ok: false };
  if (!currency || currency.length > ESTIMATE_MAX.currency) return { estimate: null, ok: false };
  if (!finiteNonNegative(raw.quantity) || !finiteNonNegative(raw.low) || !finiteNonNegative(raw.high)) {
    return { estimate: null, ok: false };
  }
  if (raw.low > raw.high) return { estimate: null, ok: false };
  if (typeof raw.placeholder !== "boolean") return { estimate: null, ok: false };

  if (!Array.isArray(raw.optionIds) || raw.optionIds.length > ESTIMATE_MAX.options) {
    return { estimate: null, ok: false };
  }
  const optionIds: string[] = [];
  for (const id of raw.optionIds) {
    if (typeof id !== "string" || id.length === 0 || id.length > ESTIMATE_MAX.optionId) {
      return { estimate: null, ok: false };
    }
    optionIds.push(id);
  }

  return {
    estimate: {
      serviceId,
      quantity: raw.quantity,
      unit,
      optionIds,
      low: raw.low,
      high: raw.high,
      currency,
      placeholder: raw.placeholder,
    },
    ok: true,
  };
}

export function validateQuote(raw: Raw, containerIds: readonly string[]): ValidationResult {
  const errors: Record<string, ErrorCode> = {};
  const tooLong = (key: keyof typeof MAX, value: string) => {
    if (value.length > MAX[key]) errors[key] = "length";
  };

  const company = text(raw, "company");
  const name = text(raw, "name");
  if (!company) errors.company = "required";
  if (!name) errors.name = "required";
  tooLong("company", company);
  tooLong("name", name);

  // Short (visit) mode sends one "contact" field: an email if it has an @.
  const contact = text(raw, "contact");
  tooLong("contact", contact);
  const email = text(raw, "email") || (contact.includes("@") ? contact : "");
  const phone = text(raw, "phone") || (contact && !contact.includes("@") ? contact : "");
  tooLong("email", email);
  tooLong("phone", phone);
  if (email && !EMAIL_PATTERN.test(email)) errors[raw.contact ? "contact" : "email"] = "email";
  if (!email && !phone) errors[raw.contact !== undefined ? "contact" : "email"] = "contact";

  const service = choice(text(raw, "service"), SERVICES);
  if (!service) errors.service = "choice";

  const shiftRaw = text(raw, "shift");
  const shift = shiftRaw ? choice(shiftRaw, SHIFTS) : null;
  if (shiftRaw && !shift) errors.shift = "choice";

  const viscosityRaw = text(raw, "viscosity");
  const viscosity = viscosityRaw ? choice(viscosityRaw, VISCOSITIES) : null;
  if (viscosityRaw && !viscosity) errors.viscosity = "choice";

  const containerRaw = text(raw, "container");
  const containerOk =
    !containerRaw || [...containerIds, ...CONTAINER_EXTRAS].includes(containerRaw);
  if (!containerOk) errors.container = "choice";

  const product = text(raw, "product");
  const units = text(raw, "units");
  const timeline = text(raw, "timeline");
  const notes = text(raw, "notes");
  tooLong("product", product);
  tooLong("units", units);
  tooLong("timeline", timeline);
  tooLong("notes", notes);

  const source = choice(text(raw, "source"), SOURCES) ?? "quote";
  const locale = choice(text(raw, "locale"), LOCALES) ?? "fr";

  const { estimate, ok: estimateOk } = validateEstimate(raw.estimate);
  if (!estimateOk) errors.estimate = "choice";

  // Low-stakes metadata: drop it rather than fail the lead if it is overlong.
  const pagePathRaw = text(raw, "page_path");
  const pagePath = pagePathRaw && pagePathRaw.length <= MAX_PAGE_PATH ? pagePathRaw : null;

  if (Object.keys(errors).length > 0 || !service) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      source,
      locale,
      company,
      name,
      email: email || null,
      phone: phone || null,
      service,
      // The shift only means something for Second Shift.
      shift: service === "second-shift" ? shift : null,
      product: product || null,
      viscosity,
      container: containerRaw || null,
      units: units || null,
      timeline: timeline || null,
      notes: notes || null,
      estimate,
      pagePath,
    },
  };
}
