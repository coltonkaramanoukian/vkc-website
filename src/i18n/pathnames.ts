// Single source of truth for every route in both locales.
// Pure data, no imports: read by next-intl routing AND by the verification
// scripts (census, guards, locale-switch check, sitemap) under plain Node.

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
// English is the default: the root redirect (src/i18n/routing.ts) detects the
// visitor's Accept-Language and only falls back here when nothing matches, so a
// header-less request (a bare curl, a crawler) lands on /en rather than /fr. A
// French browser still resolves to /fr, and the header language switch always
// offers the other locale. (The QR door /v keeps its own FR fallback; see
// src/app/v/route.ts. The x-default hreflang stays FR by design; see
// src/lib/seo.ts and the scripts/hreflang.ts guard.)
export const defaultLocale: Locale = "en";

export const pathnames = {
  "/": "/",
  "/visit": { fr: "/visite", en: "/visit" },
  "/services": { fr: "/services", en: "/services" },
  "/services/second-shift": {
    fr: "/services/deuxieme-quart",
    en: "/services/second-shift",
  },
  "/services/contract-packaging": {
    fr: "/services/conditionnement-a-forfait",
    en: "/services/contract-packaging",
  },
  "/services/toll-blending": {
    fr: "/services/melange-a-facon",
    en: "/services/toll-blending",
  },
  "/containers": { fr: "/contenants", en: "/containers" },
  "/containers/bottles-and-jugs": {
    fr: "/contenants/bouteilles-et-bidons",
    en: "/containers/bottles-and-jugs",
  },
  "/containers/pails": {
    fr: "/contenants/seaux",
    en: "/containers/pails",
  },
  "/containers/kits": {
    fr: "/contenants/trousses",
    en: "/containers/kits",
  },
  "/industries": { fr: "/secteurs", en: "/industries" },
  "/industries/cleaners": {
    fr: "/secteurs/produits-nettoyants",
    en: "/industries/cleaners",
  },
  "/industries/lubricants": {
    fr: "/secteurs/lubrifiants",
    en: "/industries/lubricants",
  },
  "/industries/sealers-and-coatings": {
    fr: "/secteurs/scellants-et-revetements",
    en: "/industries/sealers-and-coatings",
  },
  "/locations/montreal": {
    fr: "/regions/montreal",
    en: "/locations/montreal",
  },
  "/about": { fr: "/a-propos", en: "/about" },
  "/contact": { fr: "/nous-joindre", en: "/contact" },
  "/blog": { fr: "/blogue", en: "/blog" },
  // Dynamic article pattern: tells next-intl to localize /blogue/<slug> ↔
  // /blog/<slug>. Excluded from `routes` below (it is a template, not a page),
  // so the guards/sitemap/census never try to fetch a literal "[slug]" URL.
  "/blog/[slug]": { fr: "/blogue/[slug]", en: "/blog/[slug]" },
  "/glossary": { fr: "/lexique", en: "/glossary" },
  "/quote": { fr: "/soumission", en: "/quote" },
  "/privacy": { fr: "/confidentialite", en: "/privacy" },
} as const;

export type AppPathname = keyof typeof pathnames;

// Real pages only: dynamic templates (keys with "[") are for next-intl's
// localization, not for enumeration — the scripts, guards, sitemap and census
// iterate `routes`, and a literal "[slug]" path is not a fetchable page.
export const routes = Object.keys(pathnames).filter((route) => !route.includes("[")) as AppPathname[];

/** Routes that render but are excluded from the sitemap and carry noindex. */
export const noindexRoutes: readonly AppPathname[] = ["/visit"];

/** External (browser-visible) path for an internal route, e.g. /fr/visite. */
export function localizedPath(locale: Locale, route: AppPathname): string {
  const entry = pathnames[route];
  const segment = typeof entry === "string" ? entry : entry[locale];
  return segment === "/" ? `/${locale}` : `/${locale}${segment}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
