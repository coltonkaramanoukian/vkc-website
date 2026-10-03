import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "./lib/admin/session";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// The content editor lives OUTSIDE the locale tree (its own /admin/* pages, no
// next-intl). The gate: /admin/login is public; every other /admin page needs a
// valid, unexpired session cookie or it bounces to the login page. The API
// routes under /api/admin/* are excluded from the matcher and re-check auth
// themselves (request.ts), so this is the page gate, not the only lock.
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authed = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
    const isLogin = pathname === "/admin/login";

    if (isLogin) {
      if (authed) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!authed) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Locale routing runs everywhere EXCEPT:
  //   /api/*        route handlers (quote form, /api/admin/*)
  //   /v            the QR door route (app/v/route.ts); NC-8 proves it
  //   /og/*         Open Graph cards (app/og/[locale]/[key]/route.tsx)
  //   /apple-icon   the Apple touch icon (app/apple-icon.tsx). It is served
  //                 without a file extension, so the dot rule below misses it;
  //                 without this the proxy 307s it to /en/apple-icon (a 404)
  //                 and iOS home-screen bookmarks get no icon.
  //   /_next, /_vercel, and any path with a dot (sitemap.xml, robots.txt, /qr/v.svg)
  // /admin/* IS matched (not excluded) so the gate above runs before next-intl.
  matcher: ["/((?!api|og/|v$|apple-icon|_next|_vercel|.*\\..*).*)"],
};
