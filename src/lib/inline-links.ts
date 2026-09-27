// Targets a copy link may name: an internal route ("/services/pails") or a
// glossary entry by key ("/glossary#qc-sheet"). Anything else renders as
// plain text, so a typo in a message file can never ship a dead link.
import { glossaryHref, isGlossaryKey } from "./glossary-links.ts";
import { localizedPath, pathnames, type AppPathname, type Locale } from "../i18n/pathnames.ts";

const GLOSSARY_ROUTE: AppPathname = "/glossary";

export function isAppPathname(value: string): value is AppPathname {
  return Object.prototype.hasOwnProperty.call(pathnames, value);
}

/** Localized href for a copy-link target, or null when the target is unknown. */
export function resolveInlineHref(locale: Locale, target: string): string | null {
  const [route, fragment] = target.split("#", 2);
  if (route === GLOSSARY_ROUTE && fragment) {
    return isGlossaryKey(fragment) ? glossaryHref(locale, fragment) : null;
  }
  if (fragment !== undefined) return null;
  return isAppPathname(route) ? localizedPath(locale, route) : null;
}
