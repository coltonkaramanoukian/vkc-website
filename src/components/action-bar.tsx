import Link from "next/link";
import { contact, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/** Pages whose main content already is the form: the bar would point at itself. */
const WITHOUT_BAR: readonly AppPathname[] = ["/quote", "/visit", "/contact"];

/**
 * The phone's next step: a fixed bar at the bottom of small screens with
 * "Get a quote" and, when contact.json has one, the phone. From `sm` the
 * header carries the same button and the bar is gone. Rendered after the
 * footer so it is last in tab order; a spacer keeps the footer readable
 * above it.
 */
export async function ActionBar({ locale, route }: { locale: Locale; route: AppPathname }) {
  if (WITHOUT_BAR.includes(route)) return null;
  const { t } = await getCopy(locale, "common");
  const phoneHref = telHref(contact.phone);
  return (
    <>
      <div className="action-bar-spacer" aria-hidden="true" />
      <nav className="action-bar no-print" aria-label={t("actionBar")}>
        <Link href={localizedPath(locale, "/quote")} className="btn btn-primary">
          {t("cta.quote")}
        </Link>
        {contact.phone && phoneHref && (
          <a href={phoneHref} className="btn btn-secondary">
            {t("cta.call", { phone: contact.phone })}
          </a>
        )}
      </nav>
    </>
  );
}
