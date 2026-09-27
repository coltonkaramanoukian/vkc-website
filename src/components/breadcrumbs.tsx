import Link from "next/link";
import { JsonLdScript } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { groupOf, navLabelKey } from "@/lib/nav";
import { buildBreadcrumbJsonLd, type Crumb } from "@/lib/structured-data";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/**
 * Home › group hub › page. The trail is derived from lib/nav.ts, so a page
 * cannot claim a parent it does not have, and the same trail feeds
 * BreadcrumbList JSON-LD.
 */
export async function Breadcrumbs({ locale, route }: { locale: Locale; route: AppPathname }) {
  const { t } = await getCopy(locale, "common");
  const group = groupOf(route);
  const labelKey = navLabelKey(route);
  // A route outside the nav (the QR landing page) has no trail to show.
  if (route === "/" || (!labelKey && group?.hub !== route)) return null;

  const trail: { route: AppPathname; label: string }[] = [{ route: "/", label: t("home") }];
  if (group?.hub && group.hub !== route) trail.push({ route: group.hub, label: t(`groups.${group.key}`) });
  trail.push({
    route,
    label: group?.hub === route ? t(`groups.${group.key}`) : t(`nav.${labelKey}`),
  });

  const crumbs: Crumb[] = trail.map((item) => ({
    name: item.label,
    url: absoluteUrl(localizedPath(locale, item.route)),
  }));

  return (
    <nav aria-label={t("breadcrumb")} className="breadcrumbs">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.8125rem] text-graphite">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={item.route} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-ink">
                  {item.label}
                </span>
              ) : (
                <Link href={localizedPath(locale, item.route)} className="chrome-link text-graphite">
                  {item.label}
                </Link>
              )}
              {!last && (
                <span aria-hidden="true" className="inline-block h-[3px] w-3 bg-hairline" />
              )}
            </li>
          );
        })}
      </ol>
      <JsonLdScript data={buildBreadcrumbJsonLd(crumbs)} />
    </nav>
  );
}
