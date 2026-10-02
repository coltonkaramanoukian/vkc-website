// The estimator's rate card. Rates and labels live in content/pricing.json so
// the number guard (NC-3) already allows every figure, and the owner edits them
// through /admin/pricing. This module only TYPES and NORMALIZES that file — it
// never invents a value. A malformed field collapses to a safe default here so a
// bad edit degrades the estimate rather than crashing the page; the admin save
// boundary (lib/admin/pricing.ts) is where a bad edit is actually rejected.

import pricingJson from "../../../content/pricing.json" with { type: "json" };
import type { Locale } from "@/i18n/pathnames";

/** The three choices the public quote handler (lib/quote/validate.ts) accepts. */
export const QUOTE_SERVICES = ["second-shift", "bottleneck", "unsure"] as const;
export type QuoteService = (typeof QUOTE_SERVICES)[number];

/** How an option changes the subtotal: per unit, a flat add, or a multiplier. */
export const OPTION_KINDS = ["perUnit", "flat", "multiplier"] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

export type LocalizedLabel = { en: string; fr: string };

export interface PricingService {
  id: string;
  /** Which public service this line maps to when the lead is sent on. */
  quoteService: QuoteService;
  name: LocalizedLabel;
  unitLabel: LocalizedLabel;
  quantityLabel: LocalizedLabel;
  ratePerUnit: number;
  setupFee: number;
  minimum: number;
}

export interface PricingOption {
  id: string;
  name: LocalizedLabel;
  kind: OptionKind;
  value: number;
  /** Service ids this option is offered for. */
  appliesTo: string[];
}

export interface Pricing {
  /** True while the seeded placeholder rates are still in place. */
  placeholder: boolean;
  currency: string;
  /** Half-width of the range around the point estimate, in percent. */
  rangeSpreadPct: number;
  /** The low/high ends round to the nearest multiple of this. */
  roundTo: number;
  services: PricingService[];
  options: PricingOption[];
}

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

/** A finite, non-negative number, or the fallback. */
function num(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function label(value: unknown): LocalizedLabel {
  const object = asObject(value);
  const en = typeof object.en === "string" ? object.en : "";
  const fr = typeof object.fr === "string" ? object.fr : "";
  return { en, fr };
}

function quoteService(value: unknown): QuoteService {
  return (QUOTE_SERVICES as readonly string[]).includes(value as string)
    ? (value as QuoteService)
    : "unsure";
}

function optionKind(value: unknown): OptionKind {
  return (OPTION_KINDS as readonly string[]).includes(value as string) ? (value as OptionKind) : "flat";
}

function normalizeService(raw: unknown): PricingService | null {
  const object = asObject(raw);
  const id = typeof object.id === "string" ? object.id.trim() : "";
  if (!id) return null;
  return {
    id,
    quoteService: quoteService(object.quoteService),
    name: label(object.name),
    unitLabel: label(object.unitLabel),
    quantityLabel: label(object.quantityLabel),
    ratePerUnit: num(object.ratePerUnit, 0),
    setupFee: num(object.setupFee, 0),
    minimum: num(object.minimum, 0),
  };
}

function normalizeOption(raw: unknown): PricingOption | null {
  const object = asObject(raw);
  const id = typeof object.id === "string" ? object.id.trim() : "";
  if (!id) return null;
  const appliesTo = Array.isArray(object.appliesTo)
    ? object.appliesTo.filter((x): x is string => typeof x === "string")
    : [];
  return { id, name: label(object.name), kind: optionKind(object.kind), value: num(object.value, 0), appliesTo };
}

/** Normalize any raw value into a Pricing object; invalid entries are dropped. */
export function coercePricing(raw: unknown): Pricing {
  const object = asObject(raw);
  const services = (Array.isArray(object.services) ? object.services : [])
    .map(normalizeService)
    .filter((s): s is PricingService => s !== null);
  const options = (Array.isArray(object.options) ? object.options : [])
    .map(normalizeOption)
    .filter((o): o is PricingOption => o !== null);
  return {
    placeholder: object.placeholder === true,
    currency: typeof object.currency === "string" && object.currency ? object.currency : "CAD",
    rangeSpreadPct: num(object.rangeSpreadPct, 20),
    roundTo: Math.max(1, num(object.roundTo, 1)),
    services,
    options,
  };
}

/** The bundled rate card the public page renders. */
export const pricing: Pricing = coercePricing(pricingJson);

export function pricingLabel(value: LocalizedLabel, locale: Locale): string {
  return value[locale] || value.en || value.fr || "";
}

export function serviceById(config: Pricing, id: string): PricingService | undefined {
  return config.services.find((service) => service.id === id);
}

/** The options offered for a given service, in config order. */
export function optionsForService(config: Pricing, serviceId: string): PricingOption[] {
  return config.options.filter((option) => option.appliesTo.includes(serviceId));
}
