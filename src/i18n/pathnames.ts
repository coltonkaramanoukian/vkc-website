// Single source of truth for every route in both locales.
// Pure data, no imports: read by next-intl routing AND by the verification
// scripts (census, guards, locale-switch check, sitemap) under plain Node.

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

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
  "/quote": { fr: "/soumission", en: "/quote" },
  "/privacy": { fr: "/confidentialite", en: "/privacy" },
} as const;

export type AppPathname = keyof typeof pathnames;

export const routes = Object.keys(pathnames) as AppPathname[];

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
