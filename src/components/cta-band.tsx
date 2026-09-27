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

/**
 * The closing call to action, printed in negative: the page's one reversed
 * label, so the last thing on every page is also the darkest (or, in dark
 * mode, the lightest). Tokens swap as a set (brand/tokens.css .vkc-negative),
 * so the accent, the rules and the text keep their contrast inside it.
 */
export async function CtaBand({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "common");
  return (
    <section className="wrap mt-20" aria-labelledby="cta-band-heading" data-shared="cta">
      <div className="band-negative vkc-negative flex flex-col gap-7 p-7 sm:p-10 md:flex-row md:items-end md:justify-between md:gap-12 lg:p-14">
        <div className="min-w-0 md:max-w-[36rem]">
          <h2 id="cta-band-heading" className="band-heading max-w-[18ch]">
            {t("ctaBand.heading")}
          </h2>
          <p className="mt-3 max-w-[48ch] text-graphite text-[1.0625rem] sm:text-[1.125rem]">{t("ctaBand.body")}</p>
        </div>
        <CtaActions locale={locale} />
      </div>
    </section>
  );
}
