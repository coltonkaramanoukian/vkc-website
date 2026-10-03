// Formatting + the plain-text summary the estimator packs into the quote
// handler's `notes` field. Pure and locale-aware so it can be unit-tested and
// reused by the client widget. The lead reuses the existing /api/quote path, so
// this summary is all the estimator adds — no new backend (see docs/HANDOFF.md).

import { optionsForService, pricingLabel, serviceById, type Pricing } from "./pricing.ts";
import type { EstimateResult } from "./calculate.ts";
import type { Locale } from "@/i18n/pathnames";

export function formatMoney(amount: number, currency: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

export function formatRange(result: EstimateResult, locale: Locale): string {
  return `${formatMoney(result.low, result.currency, locale)} – ${formatMoney(result.high, result.currency, locale)}`;
}

export interface SummaryLabels {
  heading: string;
  service: string;
  amount: string;
  addons: string;
  range: string;
  /** Appended to the range line while placeholder rates are in force. */
  placeholder: string;
}

export interface LeadSummaryInput {
  config: Pricing;
  serviceId: string;
  quantity: number;
  optionIds: string[];
  result: EstimateResult;
  locale: Locale;
  labels: SummaryLabels;
  /** Free-text the customer added, appended after the summary. */
  notes?: string;
}

/** A compact, human-readable summary of the estimate for the quote email. */
export function buildLeadSummary(input: LeadSummaryInput): string {
  const { config, serviceId, quantity, optionIds, result, locale, labels } = input;
  const service = serviceById(config, serviceId);
  const serviceName = service ? pricingLabel(service.name, locale) : serviceId;
  const unit = service ? pricingLabel(service.unitLabel, locale) : "";

  const chosen = optionsForService(config, serviceId)
    .filter((option) => optionIds.includes(option.id))
    .map((option) => pricingLabel(option.name, locale));

  const rangeLine = result.ok
    ? `${formatRange(result, locale)}${result.placeholder ? ` (${labels.placeholder})` : ""}`
    : "—";

  const lines = [
    labels.heading,
    `${labels.service}: ${serviceName}`,
    `${labels.amount}: ${quantity}${unit ? ` ${unit}` : ""}`,
    `${labels.addons}: ${chosen.length > 0 ? chosen.join(", ") : "—"}`,
    `${labels.range}: ${rangeLine}`,
  ];

  const notes = input.notes?.trim();
  if (notes) lines.push("—", notes);
  return lines.join("\n");
}
