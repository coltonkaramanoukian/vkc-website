import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { QuoteFormSection } from "@/components/quote-form-section";
import { contact, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale, localizedPath } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/quote", "quote");
}

export default async function QuotePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const helps = raw<string[]>("quote.helps");
  const phoneHref = telHref(contact.phone);

  return (
    <PageShell locale={locale} route="/quote">
      <section className="wrap pb-8 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route="/quote" />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{t("quote.eyebrow")}</p>
            <h1 id="quote-heading" className="mt-4 max-w-[20ch]">
              {t("quote.heading")}
            </h1>
            <p className="lead mt-5">{t("quote.lead")}</p>
            {contact.phone && phoneHref && (
              <p className="mt-6">
                <a href={phoneHref} className="btn btn-secondary">
                  {t("common.cta.call", { phone: contact.phone })}
                </a>
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <Pictogram name="clipboard" className="page-picto" />
          </div>
        </div>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      <div className="wrap grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <section aria-labelledby="quote-heading" className="placard p-5 sm:p-8 lg:p-10">
          <QuoteFormSection locale={locale} mode="full" />
        </section>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="eyebrow">{t("quote.nextHeading")}</p>
            <p className="mt-3">{t("quote.next")}</p>
          </div>
          <div>
            <p className="eyebrow">{t("quote.helpsHeading")}</p>
            <ul className="mt-3">
              {helps.map((item) => (
                <li key={item} className="placard-row border-hairline py-2.5 first:border-t">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">{t("quote.dataHeading")}</p>
            <p className="mt-3 text-graphite">
              {t("quote.data")}{" "}
              <Link href={localizedPath(locale, "/privacy")}>{t("common.nav.privacy")}</Link>
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
