import { getCopy } from "@/lib/i18n";
import {
  localizedPath,
  otherLocale,
  type AppPathname,
  type Locale,
} from "@/i18n/pathnames";

/**
 * Same page, other locale — never home. A plain link computed from the
 * pathnames map, so it works without JavaScript. NC-7 asserts every pair.
 */
export async function LocaleSwitch({ locale, route }: { locale: Locale; route: AppPathname }) {
  const { t } = await getCopy(locale, "common");
  const target = otherLocale(locale);
  return (
    <a
      href={localizedPath(target, route)}
      hrefLang={target === "fr" ? "fr-CA" : "en-CA"}
      lang={target === "fr" ? "fr-CA" : "en-CA"}
      aria-label={t("otherLocaleLabel")}
      data-locale-switch={target}
      className="inline-flex min-h-[44px] items-center px-2 font-mono text-sm font-medium text-ink"
    >
      {t("otherLocaleName")}
    </a>
  );
}
