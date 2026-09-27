import Link from "next/link";
import { LocaleSwitch } from "@/components/locale-switch";
import { NavMenu } from "@/components/nav-menu";
import { Wordmark } from "@/components/wordmark";
import { contact, site, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { navGroups, primaryNav } from "@/lib/nav";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

export async function SiteHeader({ locale, route }: { locale: Locale; route: AppPathname }) {
  const { t } = await getCopy(locale, "common");
  const href = (r: AppPathname) => localizedPath(locale, r);
  const phoneHref = telHref(contact.phone);

  const panel = (
    <div className="menu-panel">
      <nav aria-label={t("footerNav")} className="wrap py-6 lg:py-8">
        <div className="grid gap-2 lg:grid-cols-5 lg:gap-8">
          {navGroups.map((group) => (
            <div key={group.key} className="menu-group">
              <p className="field-name mb-1">{t(`groups.${group.key}`)}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.route}>
                    <Link
                      href={href(item.route)}
                      className="menu-link"
                      aria-current={item.route === route ? "page" : undefined}
                    >
                      {t(`nav.${item.label}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-6 sm:hidden">
          <Link href={href("/quote")} className="btn btn-primary">
            {t("cta.quote")}
          </Link>
          {contact.phone && phoneHref && (
            <a href={phoneHref} className="btn btn-secondary">
              {t("cta.call", { phone: contact.phone })}
            </a>
          )}
        </div>
      </nav>
    </div>
  );

  return (
    <header className="site-header">
      <div className="wrap header-bar">
        <Link
          href={href("/")}
          aria-label={`${site.brandName}, ${t("home")}`}
          className="inline-flex min-h-[44px] items-center text-ink"
        >
          <Wordmark className="h-[17px] w-auto sm:h-5" />
        </Link>

        <nav aria-label={t("primaryNav")} className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.9375rem]">
            {primaryNav.map((item) => (
              <li key={item.route}>
                <Link
                  href={href(item.route)}
                  aria-current={item.route === route ? "page" : undefined}
                  className="chrome-link"
                >
                  {t(`nav.${item.label}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <LocaleSwitch locale={locale} route={route} />
          <NavMenu label={t("menu")} panel={panel} />
          <Link href={href("/quote")} className="btn btn-primary hidden sm:inline-flex">
            {t("cta.quote")}
          </Link>
        </div>
      </div>
    </header>
  );
}
