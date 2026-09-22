import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { contact, site, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { navGroups } from "@/lib/nav";
import { localizedPath, type Locale } from "@/i18n/pathnames";

function addressLine(): string | null {
  const { street, city, province, postalCode, country } = contact.address;
  const parts = [street, city, province, postalCode, country].filter(
    (part): part is string => typeof part === "string" && part.trim() !== "",
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function SiteFooter({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "common");
  const phoneHref = telHref(contact.phone);
  const address = addressLine();
  const hours = contact.hours[locale];
  // Build year; guard/number-allowlist.json carries it (see its note).
  const year = new Date().getFullYear();

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
    <footer className="mt-20 border-t border-hairline bg-label">
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div>
          <Link
            href={localizedPath(locale, "/")}
            aria-label={`${site.brandName}, ${t("home")}`}
            className="inline-flex text-ink"
          >
            <Wordmark className="h-5 w-auto" />
          </Link>
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
        {navGroups.map((group) => (
          <nav key={group.key} aria-label={t(`groups.${group.key}`)}>
            <h2 className="field-name">{t(`groups.${group.key}`)}</h2>
            <ul className="mt-2 space-y-1.5 text-[0.9375rem]">
              {group.items.map((item) => (
                <li key={item.route}>
                  <Link href={localizedPath(locale, item.route)} className="text-ink no-underline hover:underline">
                    {t(`nav.${item.label}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="wrap pb-10">
        <p className="field-name">
          © {year} {site.legalName}
        </p>
      </div>
    </footer>
  );
}
