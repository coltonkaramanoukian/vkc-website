import { JsonLdScript } from "@/components/json-ld";
import { absoluteUrl, services, site } from "@/lib/content";
import { buildServiceJsonLd } from "@/lib/structured-data";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/**
 * schema.org Service for a service page. Name and description come from
 * content/services.json only: the Second Shift summary there carries all four
 * facts, so the JSON-LD is a D16 surface that passes on its own text.
 */
export function ServiceJsonLd({
  locale,
  route,
  service,
}: {
  locale: Locale;
  route: AppPathname;
  service: "secondShift" | "bottleneck";
}) {
  const entry = services[service];
  return (
    <JsonLdScript
      data={buildServiceJsonLd({
        name: entry.name[locale],
        description: entry.summary[locale],
        url: absoluteUrl(localizedPath(locale, route)),
        providerId: `${site.baseUrl}/#organization`,
      })}
    />
  );
}
