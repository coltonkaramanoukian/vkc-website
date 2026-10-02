// The estimate math, pure and framework-free so it can be unit-tested and run
// unchanged in the browser. Every figure it uses comes from a Pricing object
// (content/pricing.json); it hardcodes nothing. The result is a ballpark RANGE,
// never a single binding price — see the disclaimer copy on the estimate page.

import {
  optionsForService,
  serviceById,
  type Pricing,
  type PricingOption,
  type PricingService,
} from "./pricing.ts";

export interface EstimateInput {
  serviceId: string;
  /** The quantity the customer entered, in the service's own unit. */
  quantity: number;
  /** Ids of the options the customer ticked. */
  optionIds: string[];
}

export interface EstimateResult {
  ok: boolean;
  currency: string;
  /** The low and high ends of the ballpark range, rounded. */
  low: number;
  high: number;
  /** The midpoint before the spread is applied (minimum-floored). */
  point: number;
  placeholder: boolean;
}

function empty(config: Pricing): EstimateResult {
  return { ok: false, currency: config.currency, low: 0, high: 0, point: 0, placeholder: config.placeholder };
}

function roundTo(value: number, step: number): number {
  const safe = step > 0 ? step : 1;
  return Math.round(value / safe) * safe;
}

/** The options the customer picked that are actually offered for this service. */
function pickedOptions(config: Pricing, service: PricingService, optionIds: string[]): PricingOption[] {
  const offered = new Set(optionsForService(config, service.id).map((option) => option.id));
  const wanted = new Set(optionIds);
  return config.options.filter((option) => offered.has(option.id) && wanted.has(option.id));
}

/**
 * Point estimate:
 *   base       = ratePerUnit × quantity
 *   + perUnit  option values × quantity
 *   + flat     option values + setupFee
 *   × product of multiplier option values   (e.g. rush = 1.25)
 *   floored at the service minimum.
 */
export function calculateEstimate(config: Pricing, input: EstimateInput): EstimateResult {
  const service = serviceById(config, input.serviceId);
  if (!service) return empty(config);

  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return empty(config);

  const options = pickedOptions(config, service, input.optionIds);

  const perUnitAdd = options
    .filter((option) => option.kind === "perUnit")
    .reduce((sum, option) => sum + option.value, 0);
  const flatAdd = options
    .filter((option) => option.kind === "flat")
    .reduce((sum, option) => sum + option.value, service.setupFee);
  const multiplier = options
    .filter((option) => option.kind === "multiplier")
    .reduce((product, option) => product * option.value, 1);

  const subtotal = (service.ratePerUnit + perUnitAdd) * quantity + flatAdd;
  const point = Math.max(subtotal * multiplier, service.minimum);

  const spread = Math.max(0, config.rangeSpreadPct) / 100;
  const low = Math.max(roundTo(point * (1 - spread), config.roundTo), service.minimum);
  const high = roundTo(point * (1 + spread), config.roundTo);

  return { ok: true, currency: config.currency, low, high, point, placeholder: config.placeholder };
}

/** The quote-handler service enum this estimator line maps to. */
export function quoteServiceFor(config: Pricing, serviceId: string): string {
  return serviceById(config, serviceId)?.quoteService ?? "unsure";
}
