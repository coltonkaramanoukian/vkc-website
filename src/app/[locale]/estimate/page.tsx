import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CtaBand } from "@/components/cta-band";
import { Estimator, type EstimatorCopy } from "@/components/estimator/estimator";
import { JsonLdScript } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { RelatedPages } from "@/components/related-pages";
import { services } from "@/lib/content";
import { pricing } from "@/lib/estimator/pricing";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { buildFaqJsonLd, plainText, type FaqItem } from "@/lib/structured-data";
import { isLocale, localizedPath } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/estimate", "estimate");
}

export default async function EstimatePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);

  // Flat string copy for the client widget (the faq array is rendered here).
  const page = raw<Record<string, unknown>>("pages.estimate");
  const copy: EstimatorCopy = { quoteHref: localizedPath(locale, "/quote") };
  for (const [key, value] of Object.entries(page)) {
    if (typeof value === "string") copy[key] = value;
  }

  const faq = raw<FaqItem[]>("pages.estimate.faq");
  const serviceCards = [services.secondShift, services.bottleneck];

  return (
    <PageShell locale={locale} route="/estimate">
      <section className="wrap pb-8 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route="/estimate" />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{t("pages.estimate.eyebrow")}</p>
            <h1 className="mt-4 max-w-[20ch]">{t("pages.estimate.h1")}</h1>
            <p className="lead mt-5">{t("pages.estimate.lead")}</p>
          </div>
          <div className="hidden lg:block">
            <Pictogram name="clipboard" className="page-picto" />
          </div>
        </div>
      </section>

      <section className="wrap pb-6">
        <div className="placard max-w-[62ch] p-5 sm:p-6">
          <p className="field-name">{t("pages.estimate.disclaimerTitle")}</p>
          <p className="mt-2 text-graphite">{t("pages.estimate.disclaimer")}</p>
          {pricing.placeholder && (
            <p className="mt-3 border-t border-hairline pt-3 text-sm text-graphite">{t("pages.estimate.placeholderNote")}</p>
          )}
        </div>
      </section>

      <section className="wrap" aria-labelledby="estimator-heading">
        <h2 id="estimator-heading" className="sr-only">
          {t("pages.estimate.h1")}
        </h2>
        <Estimator locale={locale} pricing={pricing} copy={copy} privacyHref={localizedPath(locale, "/privacy")} phone={null} />
      </section>

      <section className="wrap section-tight" aria-labelledby="estimate-services-heading">
        <h2 id="estimate-services-heading" className="text-[1.5rem] sm:text-[1.75rem]">
          {t("pages.estimate.servicesTitle")}
        </h2>
        <p className="lead mt-3 max-w-[60ch]">{t("pages.estimate.servicesIntro")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {serviceCards.map((service) => (
            <div key={service.name.en} className="placard p-5 sm:p-6">
              <p className="field-name">{service.where[locale]}</p>
              <h3 className="mt-1 text-[1.25rem] font-bold">{service.name[locale]}</h3>
              <p className="mt-2 text-graphite">{service.summary[locale]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section-tight" aria-labelledby="estimate-faq-heading">
        <h2 id="estimate-faq-heading" className="text-[1.5rem] sm:text-[1.75rem]">
          {t("pages.estimate.faqTitle")}
        </h2>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-[var(--vkc-radius)] border border-hairline bg-hairline">
          {faq.map((item) => (
            <div key={item.q} className="bg-floor p-5 sm:p-6">
              <dt className="font-bold text-ink">{item.q}</dt>
              <dd className="mt-2 text-graphite">{plainText(item.a)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <RelatedPages locale={locale} route="/estimate" />
      <CtaBand locale={locale} />
      <JsonLdScript data={buildFaqJsonLd(faq)} />
    </PageShell>
  );
}
