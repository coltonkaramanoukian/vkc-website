import { negotiateLocale } from "@/lib/accept-language";
import { localizedPath } from "@/i18n/pathnames";

// D17: the QR door route. Outside the locale proxy (see src/proxy.ts matcher).
// 307 to /fr/visite or /en/visit by Accept-Language, falling back to FR.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const locale = negotiateLocale(request.headers.get("accept-language"));
  return new Response(null, {
    status: 307,
    headers: {
      Location: localizedPath(locale, "/visit"),
      "Cache-Control": "private, no-store",
      Vary: "Accept-Language",
    },
  });
}
