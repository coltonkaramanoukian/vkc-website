// The save boundary for the estimator's rate card. Like validate.ts for the
// content editor: nothing is trusted from the client, the canonical Pricing is
// rebuilt field by field, every figure is coerced to a non-negative number, and
// every human-written label runs through the same staffing (§4) / claims (§1)
// matchers the published guards use. The estimator renders the labels
// client-side (out of the build guards' reach), so this is their only gate.

import {
  OPTION_KINDS,
  QUOTE_SERVICES,
  type OptionKind,
  type Pricing,
  type PricingOption,
  type PricingService,
  type QuoteService,
} from "../estimator/pricing.ts";
import { constitutionProblems, type FieldError } from "./validate.ts";

export interface PreparedPricing {
  ok: boolean;
  errors: FieldError[];
  pricing?: Pricing;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Raw = Record<string, unknown>;

const asObject = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

/** A required, non-negative number; pushes an error and returns 0 when invalid. */
function requireNumber(value: unknown, path: string, push: (e: FieldError) => void): number {
  const parsed = coerceNumber(value);
  if (parsed === null || Number.isNaN(parsed)) {
    push({ path, message: "Enter a number of zero or more." });
    return 0;
  }
  return parsed;
}

function label(raw: unknown): { en: string; fr: string } {
  const object = asObject(raw);
  return {
    en: typeof object.en === "string" ? object.en.trim() : "",
    fr: typeof object.fr === "string" ? object.fr.trim() : "",
  };
}

/** A localized label that must be present in both languages and clean (§1/§4). */
function requireLabel(raw: unknown, path: string, push: (e: FieldError) => void): { en: string; fr: string } {
  const value = label(raw);
  if (!value.en || !value.fr) push({ path, message: "A label is required in both English and French." });
  for (const problem of constitutionProblems(value.en, ["en"])) push({ path, message: problem });
  for (const problem of constitutionProblems(value.fr, ["fr"])) push({ path, message: problem });
  return value;
}

function quoteService(value: unknown): QuoteService {
  return (QUOTE_SERVICES as readonly string[]).includes(value as string) ? (value as QuoteService) : "unsure";
}

function prepareService(raw: unknown, prefix: string, push: (e: FieldError) => void): PricingService | null {
  const object = asObject(raw);
  const id = typeof object.id === "string" ? object.id.trim() : "";
  if (!id) return null; // an id-less row is an empty row — dropped, not an error.
  if (!SLUG.test(id)) push({ path: `${prefix}.id`, message: "Use lowercase letters, numbers and hyphens only." });

  return {
    id,
    quoteService: quoteService(object.quoteService),
    name: requireLabel(object.name, `${prefix}.name`, push),
    unitLabel: requireLabel(object.unitLabel, `${prefix}.unitLabel`, push),
    quantityLabel: requireLabel(object.quantityLabel, `${prefix}.quantityLabel`, push),
    ratePerUnit: requireNumber(object.ratePerUnit, `${prefix}.ratePerUnit`, push),
    setupFee: requireNumber(object.setupFee, `${prefix}.setupFee`, push),
    minimum: requireNumber(object.minimum, `${prefix}.minimum`, push),
  };
}

function prepareOption(
  raw: unknown,
  prefix: string,
  serviceIds: Set<string>,
  push: (e: FieldError) => void,
): PricingOption | null {
  const object = asObject(raw);
  const id = typeof object.id === "string" ? object.id.trim() : "";
  if (!id) return null;
  if (!SLUG.test(id)) push({ path: `${prefix}.id`, message: "Use lowercase letters, numbers and hyphens only." });

  const kind: OptionKind = (OPTION_KINDS as readonly string[]).includes(object.kind as string)
    ? (object.kind as OptionKind)
    : "flat";
  if (!(OPTION_KINDS as readonly string[]).includes(object.kind as string)) {
    push({ path: `${prefix}.kind`, message: "Choose per-unit, flat, or multiplier." });
  }

  const appliesTo = Array.isArray(object.appliesTo)
    ? object.appliesTo.filter((x): x is string => typeof x === "string" && serviceIds.has(x))
    : [];
  if (appliesTo.length === 0) push({ path: `${prefix}.appliesTo`, message: "Pick at least one service this applies to." });

  return {
    id,
    name: requireLabel(object.name, `${prefix}.name`, push),
    kind,
    value: requireNumber(object.value, `${prefix}.value`, push),
    appliesTo,
  };
}

/** Validate and shape a submitted rate card into a canonical Pricing object. */
export function preparePricing(submitted: unknown): PreparedPricing {
  const data = asObject(submitted);
  const errors: FieldError[] = [];
  const push = (e: FieldError) => errors.push(e);

  const rawServices = Array.isArray(data.services) ? data.services : [];
  const services = rawServices
    .map((raw, i) => prepareService(raw, `services.${i}`, push))
    .filter((s): s is PricingService => s !== null);
  if (services.length === 0) push({ path: "services", message: "Add at least one service." });

  const ids = services.map((s) => s.id);
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) push({ path: "services", message: `Two services share the id “${duplicate}”.` });
  const serviceIds = new Set(ids);

  const rawOptions = Array.isArray(data.options) ? data.options : [];
  const options = rawOptions
    .map((raw, i) => prepareOption(raw, `options.${i}`, serviceIds, push))
    .filter((o): o is PricingOption => o !== null);

  const currency = typeof data.currency === "string" && data.currency.trim() ? data.currency.trim() : "CAD";
  const rangeSpreadPct = requireNumber(data.rangeSpreadPct, "rangeSpreadPct", push);
  const roundToRaw = requireNumber(data.roundTo, "roundTo", push);
  const roundTo = roundToRaw >= 1 ? roundToRaw : 1;

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    pricing: { placeholder: data.placeholder === true, currency, rangeSpreadPct, roundTo, services, options },
  };
}
