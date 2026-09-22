"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "unconfigured" | "error" | "rate_limited" | "invalid";
type ErrorCode = "required" | "email" | "contact" | "choice" | "length";

export interface QuoteFormLabels {
  [key: string]: string;
}

export interface QuoteFormProps {
  mode: "full" | "short";
  locale: "fr" | "en";
  labels: QuoteFormLabels;
  containers: { id: string; name: string }[];
  phone: string | null;
  privacyHref: string;
}

const ERROR_LABEL: Record<ErrorCode, string> = {
  required: "errRequired",
  email: "errEmail",
  contact: "errContact",
  choice: "errChoice",
  length: "errLength",
};

export function QuoteForm({ mode, locale, labels: l, containers, phone, privacyHref }: QuoteFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const source = mode === "short" ? "visit" : "quote";
  const id = (name: string) => `${source}-${name}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setErrors({});
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        errors?: Record<string, ErrorCode>;
      };
      if (response.ok && result.ok) {
        setStatus("sent");
        form.reset();
      } else if (result.code === "email_not_configured") {
        setStatus("unconfigured");
      } else if (response.status === 429) {
        setStatus("rate_limited");
      } else if (result.code === "invalid" && result.errors) {
        setErrors(result.errors);
        setStatus("invalid");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const fieldError = (name: string) =>
    errors[name] ? (
      <p id={id(`${name}-error`)} className="mt-1 text-sm font-semibold text-qc">
        {l[ERROR_LABEL[errors[name]]]}
      </p>
    ) : null;

  const describedBy = (name: string, hint?: boolean) =>
    [hint ? id(`${name}-hint`) : null, errors[name] ? id(`${name}-error`) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const text = (
    name: string,
    label: string,
    opts: { required?: boolean; type?: string; autoComplete?: string; hint?: string } = {},
  ) => (
    <div>
      <label htmlFor={id(name)} className="block font-semibold">
        {label}
        {opts.required && <span className="field-name ml-2">({l.required})</span>}
      </label>
      {opts.hint && (
        <p id={id(`${name}-hint`)} className="text-sm text-graphite">
          {opts.hint}
        </p>
      )}
      <input
        id={id(name)}
        name={name}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        required={opts.required}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={describedBy(name, Boolean(opts.hint))}
        className="field-input mt-1"
      />
      {fieldError(name)}
    </div>
  );

  const statusMessage: Partial<Record<Status, string>> = {
    sending: l.sending,
    sent: l.sent,
    unconfigured: phone ? l.unconfiguredPhone.replace("{phone}", phone) : l.unconfigured,
    error: l.error,
    rate_limited: l.rateLimited,
    invalid: l.invalid,
  };
  const isProblem = status === "unconfigured" || status === "error" || status === "rate_limited" || status === "invalid";

  return (
    <form
      id={`${source}-form`}
      action="/api/quote"
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="space-y-6"
      data-form-mode={mode}
      data-form-status={status}
    >
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 sm:grid-cols-2">
        {text("company", l.company, { required: true, autoComplete: "organization" })}
        {text("name", l.name, { required: true, autoComplete: "name" })}
        {mode === "full" ? (
          <>
            {text("email", l.email, { type: "email", autoComplete: "email" })}
            {text("phone", l.phone, { type: "tel", autoComplete: "tel" })}
          </>
        ) : (
          text("contact", l.contact, { required: true, autoComplete: "on" })
        )}
      </div>

      <fieldset aria-describedby={describedBy("service")}>
        <legend className="font-semibold">
          {l.service}
          <span className="field-name ml-2">({l.required})</span>
        </legend>
        <div className="mt-2 space-y-2">
          <div data-guard="second-shift" className="placard px-4 py-3">
            <label className="flex gap-3">
              <input type="radio" name="service" value="second-shift" className="mt-1.5 size-5 accent-qc" aria-describedby={id("ss-hint")} />
              <span>
                <span className="font-semibold">{l.serviceSs}</span>
                <span id={id("ss-hint")} className="block text-sm text-graphite">
                  {l.ssHint}
                </span>
              </span>
            </label>
          </div>
          <div className="placard px-4 py-3">
            <label className="flex gap-3">
              <input type="radio" name="service" value="bottleneck" className="mt-1.5 size-5 accent-qc" aria-describedby={id("bn-hint")} />
              <span>
                <span className="font-semibold">{l.serviceBn}</span>
                <span id={id("bn-hint")} className="block text-sm text-graphite">
                  {l.bnHint}
                </span>
              </span>
            </label>
          </div>
          <div className="placard px-4 py-3">
            <label className="flex gap-3">
              <input type="radio" name="service" value="unsure" className="mt-1.5 size-5 accent-qc" />
              <span className="font-semibold">{l.serviceUnsure}</span>
            </label>
          </div>
        </div>
        {fieldError("service")}
      </fieldset>

      {mode === "full" && (
        <>
          <fieldset className="shift-field">
            <legend className="font-semibold">{l.shift}</legend>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {(["evenings", "nights", "weekends", "unsure"] as const).map((value) => (
                <label key={value} className="flex min-h-[44px] items-center gap-2">
                  <input type="radio" name="shift" value={value} className="size-5 accent-qc" />
                  {l[`shift${value[0].toUpperCase()}${value.slice(1)}`]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            {text("product", l.product, { hint: l.productHint })}
            <div>
              <label htmlFor={id("viscosity")} className="block font-semibold">
                {l.viscosity}
              </label>
              <select id={id("viscosity")} name="viscosity" defaultValue="" className="field-input mt-1">
                <option value="">{l.containerChoose}</option>
                <option value="water-thin">{l.viscosityWater}</option>
                <option value="pourable">{l.viscosityPourable}</option>
                <option value="thick">{l.viscosityThick}</option>
                <option value="paste">{l.viscosityPaste}</option>
                <option value="unsure">{l.viscosityUnsure}</option>
              </select>
              {fieldError("viscosity")}
            </div>
            <div>
              <label htmlFor={id("container")} className="block font-semibold">
                {l.container}
              </label>
              <select id={id("container")} name="container" defaultValue="" className="field-input mt-1">
                <option value="">{l.containerChoose}</option>
                {containers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="other">{l.containerOther}</option>
                <option value="unsure">{l.containerUnsure}</option>
              </select>
              {fieldError("container")}
            </div>
            {text("units", l.units)}
            {text("timeline", l.timeline, { hint: l.timelineHint })}
          </div>
        </>
      )}

      <div>
        <label htmlFor={id("notes")} className="block font-semibold">
          {l.notes}
        </label>
        <textarea id={id("notes")} name="notes" rows={4} className="field-input mt-1" />
        {fieldError("notes")}
      </div>

      <div className="hp-field" aria-hidden="true">
        <label htmlFor={id("website")}>{l.honeypot}</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-3">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === "sending"}>
          {mode === "short" ? l.submitVisit : l.submitQuote}
        </button>
        {/* Two live regions, always mounted, so announcements are reliable. */}
        <p role="status" className="min-h-[1.5em]" data-quote-status={isProblem ? "" : status}>
          {isProblem ? "" : (statusMessage[status] ?? "")}
        </p>
        <p role="alert" className="font-semibold text-qc" data-quote-problem={isProblem ? status : ""}>
          {isProblem ? statusMessage[status] : ""}
        </p>
        <p className="text-sm text-graphite">
          {l.privacy} <a href={privacyHref}>{l.privacyLink}</a>
        </p>
      </div>
    </form>
  );
}
