"use client";

import type { FormValue, LocalizedValue } from "@/lib/admin/prefill";
import type { Field } from "@/lib/admin/sections";

const INPUT =
  "w-full rounded-lg border border-hairline bg-floor px-3 py-2 text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-qc placeholder:text-graphite/60";

function isLocalized(value: FormValue): value is LocalizedValue {
  return typeof value === "object" && value !== null && "en" in value;
}

function Hint({ hint }: { hint?: string }) {
  if (!hint) return null;
  return <p className="mt-1 text-xs text-graphite">{hint}</p>;
}

function ErrorLine({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-qc">
      {error}
    </p>
  );
}

export interface AdminFieldProps {
  field: Field;
  value: FormValue;
  onChange: (value: FormValue) => void;
  error?: string;
  /** Unique DOM id prefix (list entries reuse field paths). */
  idPrefix: string;
}

export function AdminField({ field, value, onChange, error, idPrefix }: AdminFieldProps) {
  const id = `${idPrefix}-${field.path}`;

  if (field.type === "boolean") {
    return (
      <label htmlFor={id} className="flex items-center gap-3 py-1">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 rounded border-hairline bg-floor text-qc accent-qc focus-visible:ring-2 focus-visible:ring-qc"
        />
        <span className="text-sm text-ink">{field.label}</span>
      </label>
    );
  }

  if (field.type === "localized" || field.type === "localizedTextarea") {
    const localized = isLocalized(value) ? value : { en: "", fr: "" };
    const multiline = field.type === "localizedTextarea";
    return (
      <div className="space-y-2">
        <span className="block font-mono text-xs uppercase tracking-wider text-graphite">{field.label}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["en", "fr"] as const).map((locale) => {
            const localeId = `${id}-${locale}`;
            const common = {
              id: localeId,
              value: localized[locale],
              onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange({ ...localized, [locale]: event.target.value }),
              className: INPUT,
              "aria-label": `${field.label} (${locale.toUpperCase()})`,
            };
            return (
              <div key={locale}>
                <label htmlFor={localeId} className="mb-1 block text-xs text-graphite">
                  {locale === "en" ? "English" : "Français"}
                </label>
                {multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
              </div>
            );
          })}
        </div>
        <Hint hint={field.hint} />
        <ErrorLine error={error} />
      </div>
    );
  }

  const stringValue = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  const common = {
    id,
    value: stringValue,
    placeholder: field.placeholder,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    className: INPUT,
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-mono text-xs uppercase tracking-wider text-graphite">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea rows={3} {...common} />
      ) : (
        <input
          type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "url" ? "url" : field.type === "number" ? "number" : "text"}
          inputMode={field.type === "number" ? "decimal" : undefined}
          {...common}
        />
      )}
      <Hint hint={field.hint} />
      <ErrorLine error={error} />
    </div>
  );
}
