"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { calculateEstimate, quoteServiceFor } from "@/lib/estimator/calculate";
import {
  optionsForService,
  pricingLabel,
  serviceById,
  type Pricing,
} from "@/lib/estimator/pricing";
import { formatRange } from "@/lib/estimator/summary";
import { MAX_LENGTHS } from "@/lib/quote/validate";
import type { Locale } from "@/i18n/pathnames";

export type EstimatorCopy = Record<string, string>;

// Client-only gate: false during SSR and the first hydration render (so the
// no-JS/guard capture sees only the static fallback), true once mounted. Done
// with useSyncExternalStore rather than a setState-in-effect so it is both
// hydration-safe and lint-clean.
const subscribe = () => () => {};

interface Props {
  locale: Locale;
  pricing: Pricing;
  copy: EstimatorCopy;
  privacyHref: string;
  phone: string | null;
}

type Step = "service" | "quantity" | "options" | "result" | "details";
type SendStatus = "idle" | "sending" | "sent" | "error" | "rate_limited" | "invalid" | "unconfigured";

const FIELD = "field-input mt-1.5";

/**
 * The interactive estimator: service → amount → add-ons → ballpark → details.
 * It renders nothing until mounted, so the no-JS/SSR capture the guards scan
 * only ever sees the static fallback (the page's own copy carries the §4 facts);
 * every computed figure lives here, client-side, out of the guards' reach.
 * The lead reuses /api/quote unchanged — the estimate rides along in `notes`.
 */
export function Estimator({ locale, pricing, copy, privacyHref, phone }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const [serviceId, setServiceId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("service");
  const [quantityTouched, setQuantityTouched] = useState(false);

  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");

  const options = useMemo(() => (serviceId ? optionsForService(pricing, serviceId) : []), [pricing, serviceId]);
  const steps = useMemo<Step[]>(
    () => ["service", "quantity", ...(options.length > 0 ? (["options"] as Step[]) : []), "result", "details"],
    [options.length],
  );

  const quantityNumber = Number(quantity);
  const quantityValid = Number.isFinite(quantityNumber) && quantityNumber > 0;
  const result = useMemo(
    () => calculateEstimate(pricing, { serviceId, quantity: quantityNumber, optionIds }),
    [pricing, serviceId, quantityNumber, optionIds],
  );

  if (!mounted) {
    return (
      <div className="placard p-6 sm:p-8">
        <h2 className="text-[1.4rem]">{copy.fallbackTitle}</h2>
        <p className="mt-3 text-graphite">{copy.fallbackBody}</p>
        <a href={copy.quoteHref} className="btn btn-primary mt-5 inline-flex">
          {copy.fallbackLink}
        </a>
      </div>
    );
  }

  const index = steps.indexOf(step);
  const goBy = (delta: number) => {
    const target = steps[index + delta];
    if (target) setStep(target);
  };

  function chooseService(id: string) {
    setServiceId(id);
    setOptionIds([]);
    setQuantityTouched(false);
    setStep("quantity");
  }

  function toggleOption(id: string) {
    setOptionIds((current) => (current.includes(id) ? current.filter((o) => o !== id) : [...current, id]));
  }

  function reset() {
    setServiceId("");
    setQuantity("");
    setOptionIds([]);
    setQuantityTouched(false);
    setStatus("idle");
    setStep("service");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const service = serviceById(pricing, serviceId);
    const unit = service ? pricingLabel(service.unitLabel, locale) : "";
    // The structured estimate carries a stable, non-localized unit (VCM stores
    // it machine-side); the human `units` string below stays localized.
    const unitCanonical = service ? pricingLabel(service.unitLabel, "en") : "";
    const body = {
      source: "quote",
      locale,
      company,
      name,
      contact,
      service: quoteServiceFor(pricing, serviceId),
      units: `${quantityNumber}${unit ? ` ${unit}` : ""}`,
      // `notes` carries the customer's own words only; the estimate rides as
      // structured fields so the server can forward it and rebuild the summary.
      notes,
      ...(result.ok
        ? {
            estimate: {
              serviceId,
              quantity: quantityNumber,
              unit: unitCanonical,
              optionIds,
              low: result.low,
              high: result.high,
              currency: result.currency,
              placeholder: result.placeholder,
            },
          }
        : {}),
      page_path: typeof window === "undefined" ? null : window.location.pathname,
      website: honeypot,
    };
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const reply = (await response.json().catch(() => ({}))) as { ok?: boolean; code?: string };
      if (response.ok && reply.ok) setStatus("sent");
      else if (reply.code === "email_not_configured") setStatus("unconfigured");
      else if (response.status === 429) setStatus("rate_limited");
      else if (reply.code === "invalid") setStatus("invalid");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const service = serviceById(pricing, serviceId);
  const stepTitles: Record<Step, string> = {
    service: copy.stepService,
    quantity: copy.stepQuantity,
    options: copy.stepOptions,
    result: copy.stepResult,
    details: copy.stepDetails,
  };
  const problem = status === "error" || status === "rate_limited" || status === "invalid" || status === "unconfigured";
  const statusText: Partial<Record<SendStatus, string>> = {
    sending: copy.sending,
    error: copy.errorMsg,
    rate_limited: copy.rateLimited,
    invalid: copy.invalid,
    unconfigured: phone ? copy.unconfiguredPhone.replace("{phone}", phone) : copy.unconfigured,
  };

  return (
    <div className="placard p-5 sm:p-7" data-estimator>
      {/* Progress rail: the steps in order, the current one marked. */}
      <ol className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.75rem] uppercase tracking-wider">
        {steps.map((s, i) => (
          <li key={s} className={i === index ? "text-qc" : "text-graphite"} aria-current={i === index ? "step" : undefined}>
            {stepTitles[s]}
          </li>
        ))}
      </ol>

      <div className="mt-6">
        {step === "service" && (
          <fieldset>
            <legend className="font-semibold">{copy.serviceHeading}</legend>
            <div className="mt-3 grid gap-2">
              {pricing.services.map((s) => (
                <label key={s.id} className="choice">
                  <input
                    type="radio"
                    name="estimator-service"
                    value={s.id}
                    checked={serviceId === s.id}
                    onChange={() => chooseService(s.id)}
                    className="mt-1.5 size-5 shrink-0 accent-qc"
                  />
                  <span className="min-w-0 flex-1 font-semibold">{pricingLabel(s.name, locale)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === "quantity" && service && (
          <div>
            <label htmlFor="estimator-quantity" className="block font-semibold">
              {copy.quantityHeading}
            </label>
            <p id="estimator-quantity-hint" className="text-sm text-graphite">
              {copy.quantityHint}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                id="estimator-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => setQuantityTouched(true)}
                aria-invalid={quantityTouched && !quantityValid ? true : undefined}
                aria-describedby={`estimator-quantity-hint${quantityTouched && !quantityValid ? " estimator-quantity-error" : ""}`}
                className="field-input max-w-[12rem]"
              />
              <span className="text-graphite">{pricingLabel(service.unitLabel, locale)}</span>
            </div>
            {quantityTouched && !quantityValid && (
              <p id="estimator-quantity-error" role="alert" className="mt-1.5 text-sm font-semibold text-qc">
                {copy.quantityError}
              </p>
            )}
          </div>
        )}

        {step === "options" && (
          <fieldset>
            <legend className="font-semibold">{copy.optionsHeading}</legend>
            <p className="text-sm text-graphite">{copy.optionsHint}</p>
            {options.length === 0 ? (
              <p className="mt-3 text-graphite">{copy.optionsNone}</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {options.map((o) => (
                  <label key={o.id} className="choice">
                    <input
                      type="checkbox"
                      checked={optionIds.includes(o.id)}
                      onChange={() => toggleOption(o.id)}
                      className="mt-1.5 size-5 shrink-0 accent-qc"
                    />
                    <span className="min-w-0 flex-1 font-semibold">{pricingLabel(o.name, locale)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )}

        {step === "result" && (
          <div aria-live="polite">
            <h2 className="text-[1.4rem]">{copy.resultHeading}</h2>
            <p className="mt-1 font-mono text-sm uppercase tracking-wider text-graphite">{copy.resultRangeLabel}</p>
            <p className="mt-1 text-[2rem] font-semibold text-ink">{result.ok ? formatRange(result, locale) : "—"}</p>
            {result.placeholder && (
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-qc">{copy.placeholderTag}</p>
            )}
            <p className="mt-4 text-graphite">{copy.resultNote}</p>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={onSubmit} noValidate className="space-y-5" data-estimator-lead>
            <div>
              <h2 className="text-[1.4rem]">{copy.detailsHeading}</h2>
              <p className="mt-1 text-graphite">{copy.detailsIntro}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="estimator-company" className="block font-semibold">
                  {copy.company} <span className="field-name">({copy.required})</span>
                </label>
                <input id="estimator-company" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" required maxLength={MAX_LENGTHS.company} className={FIELD} />
              </div>
              <div>
                <label htmlFor="estimator-name" className="block font-semibold">
                  {copy.name} <span className="field-name">({copy.required})</span>
                </label>
                <input id="estimator-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={MAX_LENGTHS.name} className={FIELD} />
              </div>
            </div>
            <div>
              <label htmlFor="estimator-contact" className="block font-semibold">
                {copy.contact} <span className="field-name">({copy.required})</span>
              </label>
              <p id="estimator-contact-hint" className="text-sm text-graphite">{copy.contactHint}</p>
              <input
                id="estimator-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                autoComplete="on"
                required
                maxLength={MAX_LENGTHS.contact}
                aria-describedby="estimator-contact-hint"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="estimator-notes" className="block font-semibold">{copy.notes}</label>
              <p id="estimator-notes-hint" className="text-sm text-graphite">{copy.notesHint}</p>
              <textarea id="estimator-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={MAX_LENGTHS.notes} aria-describedby="estimator-notes-hint" className={FIELD} />
            </div>

            <div className="hp-field" aria-hidden="true">
              <label htmlFor="estimator-website">Website</label>
              <input id="estimator-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={status === "sending"}>
              {copy.submit}
            </button>

            <p role="status" className="min-h-[1.5em] font-semibold" data-estimator-status={problem ? "" : status}>
              {!problem ? (statusText[status] ?? "") : ""}
            </p>
            <p role="alert" className="font-semibold text-qc" data-estimator-problem={problem ? status : ""}>
              {problem ? statusText[status] : ""}
            </p>
            {status === "sent" && (
              <div className="placard p-5" data-estimator-sent>
                <p className="field-name">{copy.sent}</p>
                <p className="mt-2">{copy.sentBody}</p>
              </div>
            )}
            <p className="text-sm text-graphite">
              {copy.privacy} <a href={privacyHref}>{copy.privacyLink}</a>
            </p>
          </form>
        )}
      </div>

      {/* Navigation: Back / Next between steps, with a reset once a service is
          chosen. After a successful send Back/Next drop away but "Start over"
          stays, so the widget is never a dead-end. */}
      {(status !== "sent" || serviceId) && (
        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
          {status !== "sent" && index > 0 && (
            <button type="button" onClick={() => goBy(-1)} className="btn btn-secondary">
              {copy.back}
            </button>
          )}
          {step !== "details" && step !== "service" && (
            <button
              type="button"
              onClick={() => goBy(1)}
              disabled={step === "quantity" && !quantityValid}
              className="btn btn-primary"
            >
              {step === "result" ? copy.getQuote : copy.next}
            </button>
          )}
          {serviceId && (
            <button type="button" onClick={reset} className="chrome-link ml-auto text-sm text-graphite">
              {copy.reset}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
