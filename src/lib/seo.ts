import type { Metadata } from "next";
import { absoluteUrl, site } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import {
  localizedPath,
  noindexRoutes,
  type AppPathname,
  type Locale,
} from "@/i18n/pathnames";

export const HREFLANG: Record<Locale, string> = { fr: "fr-CA", en: "en-CA" };

/** hreflang alternates for a route: both locales plus x-default (FR, a 200). */
export function alternateLanguages(route: AppPathname): Record<string, string> {
  return {
    [HREFLANG.fr]: absoluteUrl(localizedPath("fr", route)),
    [HREFLANG.en]: absoluteUrl(localizedPath("en", route)),
    "x-default": absoluteUrl(localizedPath("fr", route)),
  };
}

/**
 * Per-page metadata in both locales (D10). `key` points at meta.<key>.title /
 * meta.<key>.description in the message files.
 */
export async function pageMetadata(
  locale: Locale,
  route: AppPathname,
  key: string,
  { absoluteTitle = false }: { absoluteTitle?: boolean } = {},
): Promise<Metadata> {
  const { t } = await getCopy(locale, "meta");
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  const url = absoluteUrl(localizedPath(locale, route));
  const noindex = noindexRoutes.includes(route);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: alternateLanguages(route) },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: site.brandName,
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      alternateLocale: [locale === "fr" ? "en_CA" : "fr_CA"],
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}
