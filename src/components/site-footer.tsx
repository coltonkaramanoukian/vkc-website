import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { addressLine, contact, site, tagline, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { navGroups } from "@/lib/nav";
import { localizedPath, otherLocale, type AppPathname, type Locale } from "@/i18n/pathnames";

export async function SiteFooter({ locale, route }: { locale: Locale; route: AppPathname }) {
  const { t } = await getCopy(locale, "common");
  const phoneHref = telHref(contact.phone);
  const address = addressLine();
  const hours = contact.hours[locale];
  // Build year; guard/number-allowlist.json carries it (see its note).
  const year = new Date().getFullYear();
  const target = otherLocale(locale);

  const contactRows = [
    contact.phone && phoneHref
      ? { key: "phone", label: t("contact.phone"), node: <a href={phoneHref}>{contact.phone}</a> }
      : null,
    contact.email
      ? { key: "email", label: t("contact.email"), node: <a href={`mailto:${contact.email}`}>{contact.email}</a> }
      : null,
    address ? { key: "address", label: t("contact.address"), node: <span>{address}</span> } : null,
    hours ? { key: "hours", label: t("contact.hours"), node: <span>{hours}</span> } : null,
  ].filter((row) => row !== null);

  return (
    <footer className="site-footer mt-24 border-t border-hairline bg-label">
      <div className="wrap grid gap-10 py-14 lg:grid-cols-[1.6fr_repeat(5,1fr)] lg:gap-8">
        <div className="max-w-sm">
          <Link
            href={localizedPath(locale, "/")}
            aria-label={`${site.brandName}, ${t("home")}`}
            className="inline-flex text-ink"
          >
            <Wordmark className="h-5 w-auto" />
          </Link>
          <p className="mt-4 text-[1.125rem] font-bold leading-snug [font-stretch:112.5%]">{tagline(locale)}</p>
          <p className="field-name mt-3">{site.legalName}</p>
          {contactRows.length > 0 && (
            <dl className="mt-5 space-y-2 text-[0.9375rem]">
              {contactRows.map((row) => (
                <div key={row.key}>
                  <dt className="field-name">{row.label}</dt>
                  <dd>{row.node}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-5">
          {navGroups.map((group) => (
            <nav key={group.key} aria-label={t(`groups.${group.key}`)}>
              <h2 className="field-name">
                {group.hub ? (
                  <Link href={localizedPath(locale, group.hub)} className="chrome-link text-graphite">
                    {t(`groups.${group.key}`)}
                  </Link>
                ) : (
                  t(`groups.${group.key}`)
                )}
              </h2>
              <ul className="mt-2.5 space-y-2 text-[0.9375rem]">
                {group.items.map((item) => (
                  <li key={item.route}>
                    <Link href={localizedPath(locale, item.route)} className="chrome-link">
                      {t(`nav.${item.label}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline py-6">
        <p className="field-name">
          © {year} {site.legalName}
        </p>
        <a
          href={localizedPath(target, route)}
          hrefLang={target === "fr" ? "fr-CA" : "en-CA"}
          lang={target === "fr" ? "fr-CA" : "en-CA"}
          className="field-name chrome-link"
        >
          {t("otherLocaleName")}
        </a>
      </div>
    </footer>
  );
}
