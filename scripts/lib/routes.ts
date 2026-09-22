// Every URL the site serves, enumerated from the pathnames map (never by hand).
import {
  locales,
  localizedPath,
  noindexRoutes,
  otherLocale,
  routes,
  type AppPathname,
  type Locale,
} from "../../src/i18n/pathnames.ts";

export interface SiteUrl {
  locale: Locale;
  route: AppPathname;
  path: string;
  indexable: boolean;
}

export function allUrls(): SiteUrl[] {
  return routes.flatMap((route) =>
    locales.map((locale) => ({
      locale,
      route,
      path: localizedPath(locale, route),
      indexable: !noindexRoutes.includes(route),
    })),
  );
}

export function expectedPageCount(): number {
  return routes.length * locales.length;
}

export { locales, localizedPath, otherLocale, routes };
export type { AppPathname, Locale };

/** Stable file-name slug for a URL path: /fr/services/x → fr__services__x */
export function slug(path: string): string {
  return path.replace(/^\//, "").replace(/\//g, "__") || "root";
}
