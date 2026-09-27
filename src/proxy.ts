import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Locale routing runs everywhere EXCEPT:
  //   /api/*        route handlers (quote form)
  //   /v            the QR door route (app/v/route.ts); NC-8 proves it
  //   /og/*         Open Graph cards (app/og/[locale]/[key]/route.tsx)
  //   /_next, /_vercel, and any path with a dot (sitemap.xml, robots.txt, /qr/v.svg)
  matcher: ["/((?!api|og/|v$|_next|_vercel|.*\\..*).*)"],
};
