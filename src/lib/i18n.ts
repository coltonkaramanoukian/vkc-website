import { getTranslations } from "next-intl/server";
import { serviceNames } from "@/lib/content";
import type { Locale } from "@/i18n/pathnames";

type Values = Record<string, string | number>;

/** Replace {ss}/{bn}/… placeholders in raw message trees (arrays, objects). */
export function interpolate<T>(value: T, values: Values): T {
  if (typeof value === "string") {
    return value.replace(/\{(\w+)\}/g, (whole, key: string) =>
      key in values ? String(values[key]) : whole,
    ) as T;
  }
  if (Array.isArray(value)) return value.map((item) => interpolate(item, values)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, interpolate(v, values)]),
    ) as T;
  }
  return value;
}

/**
 * Translator with the service names pre-bound, so copy can say {ss} / {bn}
 * and a rename in content/services.json reaches every string.
 */
export async function getCopy(locale: Locale, namespace?: string) {
  const t = await getTranslations({ locale, namespace });
  const names = serviceNames(locale);
  const base: Values = { ss: names.ss, bn: names.bn };

  const text = (key: string, values?: Values): string =>
    // Keys are validated at build: request.ts throws on MISSING_MESSAGE.
    (t as unknown as (k: string, v: Values) => string)(key, { ...base, ...values });
  const raw = <T = unknown>(key: string): T =>
    interpolate((t as unknown as { raw: (k: string) => T }).raw(key), base);

  return { t: text, raw };
}
