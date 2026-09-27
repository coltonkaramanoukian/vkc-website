import en from "../../i18n/messages/en.json";

/** Card dimensions; the render lives in lib/og.tsx (server only, reads fonts). */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * One Open Graph card per `meta.<key>` entry that belongs to a page. The
 * not-found page is not shared, so it has no card.
 */
export const OG_KEYS: readonly string[] = Object.keys(en.meta).filter((key) => key !== "notFound");

export function isOgKey(key: string): boolean {
  return OG_KEYS.includes(key);
}

/** Path of the card for a page, relative to the site root. */
export function ogImagePath(locale: string, key: string): string {
  return `/og/${locale}/${key}`;
}
