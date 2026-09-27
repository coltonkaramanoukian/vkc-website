import { LocaleSwitch } from "@/components/locale-switch";
import { NavLink } from "@/components/nav-link";
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
              {group.hub ? (
                <NavLink
                  href={href(group.hub)}
                  current={group.hub === route}
                  className="field-name mb-1 inline-block text-graphite no-underline hover:text-ink hover:underline"
                >
                  {t(`groups.${group.key}`)}
                </NavLink>
              ) : (
                <p className="field-name mb-1">{t(`groups.${group.key}`)}</p>
              )}
              <ul>
                {group.items.map((item) => (
                  <li key={item.route}>
                    <NavLink href={href(item.route)} current={item.route === route} className="menu-link">
                      {t(`nav.${item.label}`)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-6 sm:hidden">
          <NavLink href={href("/quote")} current={route === "/quote"} className="btn btn-primary">
            {t("cta.quote")}
          </NavLink>
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
        <NavLink
          href={href("/")}
          current={route === "/"}
          aria-label={`${site.brandName}, ${t("home")}`}
          className="inline-flex min-h-[44px] items-center text-ink"
        >
          <Wordmark className="h-[17px] w-auto sm:h-5" />
        </NavLink>

        {/* xl, not lg: the French labels need the room, and a wrapped nav item reads as two. */}
        <nav aria-label={t("primaryNav")} className="hidden xl:block">
          <ul className="flex items-center gap-6 text-[0.9375rem] whitespace-nowrap">
            {primaryNav.map((item) => (
              <li key={item.route}>
                <NavLink href={href(item.route)} current={item.route === route} className="chrome-link">
                  {t(`nav.${item.label}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <LocaleSwitch locale={locale} route={route} />
          <NavMenu label={t("menu")} panel={panel} />
          <NavLink href={href("/quote")} current={route === "/quote"} className="btn btn-primary hidden sm:inline-flex">
            {t("cta.quote")}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
