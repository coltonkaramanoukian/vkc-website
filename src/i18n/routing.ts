import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales, pathnames } from "./pathnames";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // Cookieless: the root redirect reads Accept-Language on every visit, and the
  // site sets no cookies at all (Law 25 posture, see privacy page).
  localeCookie: false,
  // hreflang lives in each page's <head> via generateMetadata (one source).
  alternateLinks: false,
  pathnames,
});
