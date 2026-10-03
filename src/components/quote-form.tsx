"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Pictogram, type PictogramName } from "@/components/pictograms";

type Status = "idle" | "sending" | "sent" | "unconfigured" | "error" | "rate_limited" | "invalid";
type ErrorCode = "required" | "email" | "contact" | "choice" | "length";

export interface QuoteFormLabels {
  [key: string]: string;
}

export type FormSource = "quote" | "visit" | "contact";

export interface QuoteFormProps {
  mode: "full" | "short";
  /** Which page sent it; the email's first line carries it. Defaults by mode. */
  source?: FormSource;
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

const SERVICE_PICTO: Record<"second-shift" | "bottleneck" | "unsure", PictogramName> = {
  "second-shift": "plant",
  bottleneck: "facility",
  unsure: "clipboard",
};

/**
 * The quote form: three groups (you, the job, anything else), radio choices
 * as label cards, one submit. Ids are `<source>-<field>` and the two live
 * regions keep their data attributes: NC-5 drives this form by them.
 */
interface QuoteReply {
  ok?: boolean;
  code?: string;
  errors?: Record<string, ErrorCode>;
}

/**
 * The API answers JSON on every path it controls. Anything else (a gateway
 * error page, a truncated body) is logged with its status and treated as an
 * empty reply, which the caller maps to the generic error state.
 */
async function parseReply(response: Response): Promise<QuoteReply> {
  try {
    return (await response.json()) as QuoteReply;
  } catch (error) {
    console.error("[quote-form] reply was not JSON", { status: response.status, error: String(error) });
    return {};
  }
}

export function QuoteForm({ mode, source: sourceProp, locale, labels: l, containers, phone, privacyHref }: QuoteFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const source: FormSource = sourceProp ?? (mode === "short" ? "visit" : "quote");
  const id = (name: string) => `${source}-${name}`;

  // After a rejected submit, put the keyboard on the first field that needs fixing.
  useEffect(() => {
    if (status !== "invalid") return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [status, errors]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body: Record<string, FormDataEntryValue | string> = Object.fromEntries(new FormData(form).entries());
    // Where the form was submitted, for VCM's lead record (nullable, server-bounded).
    if (typeof window !== "undefined") body.page_path = window.location.pathname;
    setStatus("sending");
    setErrors({});
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const result = await parseReply(response);
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
      <p id={id(`${name}-error`)} className="mt-1.5 text-sm font-semibold text-qc">
        {l[ERROR_LABEL[errors[name]]]}
      </p>
    ) : null;

  const describedBy = (name: string, hint?: boolean, extra?: string) =>
    [hint ? id(`${name}-hint`) : null, extra ?? null, errors[name] ? id(`${name}-error`) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const text = (
    name: string,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      autoComplete?: string;
      hint?: string;
      inputMode?: "tel" | "email" | "text";
      describedById?: string;
    } = {},
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
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete}
        required={opts.required}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={describedBy(name, Boolean(opts.hint), opts.describedById)}
        className="field-input mt-1.5"
      />
      {fieldError(name)}
    </div>
  );

  const select = (name: string, label: string, options: ReactNode) => (
    <div>
      <label htmlFor={id(name)} className="block font-semibold">
        {label}
      </label>
      <select
        id={id(name)}
        name={name}
        defaultValue=""
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={describedBy(name)}
        className="field-input mt-1.5"
      >
        {options}
      </select>
      {fieldError(name)}
    </div>
  );

  const group = (title: string, children: ReactNode) => (
    <fieldset className="form-group">
      <legend className="eyebrow">{title}</legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );

  const serviceChoice = (value: "second-shift" | "bottleneck" | "unsure", label: string, hint?: string) => (
    <label className="choice" data-guard={value === "second-shift" ? "second-shift" : undefined}>
      <input
        type="radio"
        name="service"
        value={value}
        className="mt-1.5 size-5 shrink-0 accent-qc"
        aria-describedby={hint ? id(`${value}-hint`) : undefined}
      />
      <span className="flex min-w-0 flex-1 gap-4">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{label}</span>
          {hint && (
            <span id={id(`${value}-hint`)} className="mt-0.5 block text-sm text-graphite">
              {hint}
            </span>
          )}
        </span>
        <Pictogram name={SERVICE_PICTO[value]} className="hidden shrink-0 sm:block" />
      </span>
    </label>
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
      ref={formRef}
      id={`${source}-form`}
      action="/api/quote"
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="space-y-9"
      data-form-mode={mode}
      data-form-status={status}
    >
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="locale" value={locale} />

      {group(
        l.groupYou,
        mode === "full" ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              {text("company", l.company, { required: true, autoComplete: "organization" })}
              {text("name", l.name, { required: true, autoComplete: "name" })}
              {text("email", l.email, {
                type: "email",
                autoComplete: "email",
                inputMode: "email",
                describedById: id("contact-note"),
              })}
              {text("phone", l.phone, {
                type: "tel",
                autoComplete: "tel",
                inputMode: "tel",
                describedById: id("contact-note"),
              })}
            </div>
            <p id={id("contact-note")} className="text-sm text-graphite">
              {l.contactNote}
            </p>
          </>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {text("company", l.company, { required: true, autoComplete: "organization" })}
            {text("name", l.name, { required: true, autoComplete: "name" })}
            {text("contact", l.contact, { required: true, autoComplete: "on" })}
          </div>
        ),
      )}

      {group(
        l.groupJob,
        <>
          <fieldset aria-describedby={describedBy("service")}>
            <legend className="font-semibold">
              {l.service}
              <span className="field-name ml-2">({l.required})</span>
            </legend>
            <div className="mt-2 grid gap-2">
              {serviceChoice("second-shift", l.serviceSs, l.ssHint)}
              {serviceChoice("bottleneck", l.serviceBn, l.bnHint)}
              {serviceChoice("unsure", l.serviceUnsure)}
            </div>
            {fieldError("service")}
          </fieldset>

          {mode === "full" && (
            <>
              <fieldset className="shift-field">
                <legend className="font-semibold">{l.shift}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["evenings", "nights", "weekends", "unsure"] as const).map((value) => (
                    <label key={value} className="choice items-center px-4 py-2.5">
                      <input type="radio" name="shift" value={value} className="size-5 accent-qc" />
                      <span className="font-semibold">{l[`shift${value[0].toUpperCase()}${value.slice(1)}`]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                {text("product", l.product, { hint: l.productHint })}
                {select(
                  "viscosity",
                  l.viscosity,
                  <>
                    <option value="">{l.containerChoose}</option>
                    <option value="water-thin">{l.viscosityWater}</option>
                    <option value="pourable">{l.viscosityPourable}</option>
                    <option value="thick">{l.viscosityThick}</option>
                    <option value="paste">{l.viscosityPaste}</option>
                    <option value="unsure">{l.viscosityUnsure}</option>
                  </>,
                )}
                {select(
                  "container",
                  l.container,
                  <>
                    <option value="">{l.containerChoose}</option>
                    {containers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="other">{l.containerOther}</option>
                    <option value="unsure">{l.containerUnsure}</option>
                  </>,
                )}
                {text("units", l.units)}
                {text("timeline", l.timeline, { hint: l.timelineHint })}
              </div>
            </>
          )}
        </>,
      )}

      {group(
        l.groupNotes,
        <div>
          <label htmlFor={id("notes")} className="block font-semibold">
            {l.notes}
          </label>
          <textarea
            id={id("notes")}
            name="notes"
            rows={4}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={describedBy("notes")}
            className="field-input mt-1.5"
          />
          {fieldError("notes")}
        </div>,
      )}

      <div className="hp-field" aria-hidden="true">
        <label htmlFor={id("website")}>{l.honeypot}</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-4 border-t border-hairline pt-6">
        <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={status === "sending"}>
          {source === "contact" ? l.submitContact : mode === "short" ? l.submitVisit : l.submitQuote}
        </button>
        {/* Two live regions, always mounted, so announcements are reliable. */}
        <p role="status" className="min-h-[1.5em] font-semibold" data-quote-status={isProblem ? "" : status}>
          {isProblem ? "" : (statusMessage[status] ?? "")}
        </p>
        <p role="alert" className="font-semibold text-qc" data-quote-problem={isProblem ? status : ""}>
          {isProblem ? statusMessage[status] : ""}
        </p>
        {status === "sent" && (
          <div className="placard p-5" data-quote-sent>
            <p className="field-name">{l.sentHeading}</p>
            <p className="mt-2">{l.sentNext}</p>
          </div>
        )}
        <p className="text-sm text-graphite">
          {l.privacy} <a href={privacyHref}>{l.privacyLink}</a>
        </p>
      </div>
    </form>
  );
}
