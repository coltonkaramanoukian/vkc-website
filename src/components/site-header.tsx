import Link from "next/link";
import { LocaleSwitch } from "@/components/locale-switch";
import { Wordmark } from "@/components/wordmark";
import { site } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { navGroups, primaryNav } from "@/lib/nav";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

export async function SiteHeader({ locale, route }: { locale: Locale; route: AppPathname }) {
  const { t } = await getCopy(locale, "common");
  const href = (r: AppPathname) => localizedPath(locale, r);

  return (
    <header className="border-b border-hairline bg-label">
      <div className="wrap flex h-16 items-center justify-between gap-3">
        <Link
          href={href("/")}
          aria-label={`${site.brandName}, ${t("home")}`}
          className="inline-flex min-h-[44px] items-center text-ink"
        >
          <Wordmark className="h-[17px] w-auto sm:h-5" />
        </Link>

        <nav aria-label={t("primaryNav")} className="hidden lg:block">
          <ul className="flex items-center gap-6 text-[0.9375rem]">
            {primaryNav.map((item) => (
              <li key={item.route}>
                <Link
                  href={href(item.route)}
                  aria-current={item.route === route ? "page" : undefined}
                  className="text-ink no-underline hover:underline aria-[current=page]:underline"
                >
                  {t(`nav.${item.label}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitch locale={locale} route={route} />
          <details className="relative lg:hidden">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-2 font-mono text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              {t("menu")}
            </summary>
            <nav
              aria-label={t("primaryNav")}
              className="placard absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] p-4"
            >
              {navGroups.map((group) => (
                <div key={group.key} className="mb-3 last:mb-0">
                  <p className="field-name">{t(`groups.${group.key}`)}</p>
                  <ul className="mt-1">
                    {group.items.map((item) => (
                      <li key={item.route}>
                        <Link
                          href={href(item.route)}
                          className="block py-1.5 text-ink no-underline hover:underline"
                        >
                          {t(`nav.${item.label}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </details>
          <Link href={href("/quote")} className="btn btn-primary ml-1 hidden sm:inline-flex">
            {t("cta.quote")}
          </Link>
        </div>
      </div>
    </header>
  );
}
