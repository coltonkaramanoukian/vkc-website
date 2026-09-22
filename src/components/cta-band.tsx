import Link from "next/link";
import { contact, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/i18n/pathnames";

/** "Get a quote" with the phone beside it (only when contact.json has one). */
export async function CtaActions({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "common");
  const phoneHref = telHref(contact.phone);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={localizedPath(locale, "/quote")} className="btn btn-primary">
        {t("cta.quote")}
      </Link>
      {contact.phone && phoneHref && (
        <a href={phoneHref} className="btn btn-secondary">
          {t("cta.call", { phone: contact.phone })}
        </a>
      )}
    </div>
  );
}

export async function CtaBand({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "common");
  return (
    <section className="wrap mt-20" aria-labelledby="cta-band-heading" data-shared="cta">
      <div className="placard flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="cta-band-heading">{t("ctaBand.heading")}</h2>
          <p className="mt-2 text-graphite">{t("ctaBand.body")}</p>
        </div>
        <CtaActions locale={locale} />
      </div>
    </section>
  );
}
