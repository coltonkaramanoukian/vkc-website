import { tagline } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { renderOgImage } from "@/lib/og";
import { isOgKey, OG_KEYS } from "@/lib/og-keys";
import { isLocale, locales } from "@/i18n/pathnames";

// D10: one Open Graph card per page and locale, prerendered at build. The
// home card carries the tagline; every other card carries the page title.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => OG_KEYS.map((key) => ({ locale, key })));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  if (!isLocale(locale) || !isOgKey(key)) return new Response("Not found", { status: 404 });
  const headline = key === "home" ? tagline(locale) : (await getCopy(locale, "meta")).t(`${key}.title`);
  return renderOgImage(headline);
}
