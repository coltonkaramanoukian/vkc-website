import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/content";
import { alternateLanguages } from "@/lib/seo";
import { locales, localizedPath, noindexRoutes, routes } from "@/i18n/pathnames";

// D10: every indexable route in both locales; the visit page is excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return routes
    .filter((route) => !noindexRoutes.includes(route))
    .flatMap((route) =>
      locales.map((locale) => ({
        url: absoluteUrl(localizedPath(locale, route)),
        alternates: { languages: alternateLanguages(route) },
      })),
    );
}
