import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Locale routing runs everywhere EXCEPT:
  //   /api/*        route handlers (quote form)
  //   /v            the QR door route (app/v/route.ts); NC-8 proves it
  //   /og/*         Open Graph cards (app/og/[locale]/[key]/route.tsx)
  //   /apple-icon   the Apple touch icon (app/apple-icon.tsx). It is served
  //                 without a file extension, so the dot rule below misses it;
  //                 without this the proxy 307s it to /en/apple-icon (a 404)
  //                 and iOS home-screen bookmarks get no icon.
  //   /_next, /_vercel, and any path with a dot (sitemap.xml, robots.txt, /qr/v.svg)
  matcher: ["/((?!api|og/|v$|apple-icon|_next|_vercel|.*\\..*).*)"],
};
