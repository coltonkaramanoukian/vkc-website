import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DemoVideo } from "@/components/demo-video";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { QuoteFormSection } from "@/components/quote-form-section";
import { contact, services, site, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale, localizedPath } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

// D17: the page a prospect opens from the QR code (/v). noindex, not in sitemap.
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/visit", "visit");
}

export default async function VisitPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale);
  const phoneHref = telHref(contact.phone);
  const ss = services.secondShift;
  const bn = services.bottleneck;

  return (
    <PageShell locale={locale} route="/visit">
      <section className="wrap pb-8 pt-8 sm:pt-14">
        <p className="eyebrow">{site.brandName}</p>
        <h1 className="mt-4 max-w-[20ch]">{t("visit.heading")}</h1>
        <p className="lead mt-5">{t("visit.intro")}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a href="#book" className="btn btn-primary">
            {t("form.submitVisit")}
          </a>
          {contact.phone && phoneHref && (
            <a href={phoneHref} className="btn btn-secondary">
              {t("common.cta.call", { phone: contact.phone })}
            </a>
          )}
        </div>
      </section>

      <div className="wrap">
        <DemoVideo locale={locale} label={site.brandName} />
      </div>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      <section className="wrap mt-8 grid gap-5 md:grid-cols-2" aria-label={t("common.groups.services")}>
        <article className="placard flex flex-col" data-guard="second-shift">
          <header className="flex items-start justify-between gap-4 border-b-[1.5px] border-ink px-5 py-4">
            <div>
              <p className="field-name">{ss.where[locale]}</p>
              <h2 className="mt-1 text-[1.5rem]">{ss.name[locale]}</h2>
            </div>
            <Pictogram name="plant" />
          </header>
          <p className="px-5 py-4">{t("visit.ss")}</p>
          <p className="mt-auto border-t border-hairline px-5 py-3">
            <Link href={localizedPath(locale, "/services/second-shift")}>{t("visit.ssLink")}</Link>
          </p>
        </article>
        <article className="placard flex flex-col">
          <header className="flex items-start justify-between gap-4 border-b-[1.5px] border-ink px-5 py-4">
            <div>
              <p className="field-name">{bn.where[locale]}</p>
              <h2 className="mt-1 text-[1.5rem]">{bn.name[locale]}</h2>
            </div>
            <Pictogram name="facility" />
          </header>
          <p className="px-5 py-4">{t("visit.bn")}</p>
          <p className="mt-auto border-t border-hairline px-5 py-3">
            <Link href={localizedPath(locale, "/services/contract-packaging")}>{t("visit.bnLink")}</Link>
          </p>
        </article>
      </section>

      <section id="book" className="wrap mt-14 scroll-mt-24" aria-labelledby="book-heading">
        <div className="placard p-5 sm:p-8">
          <p className="eyebrow">{t("visit.formEyebrow")}</p>
          <h2 id="book-heading" className="mt-3">
            {t("visit.formHeading")}
          </h2>
          <p className="mt-2 max-w-[52ch] text-graphite">{t("visit.formIntro")}</p>
          <div className="mt-8 max-w-3xl">
            <QuoteFormSection locale={locale} mode="short" />
          </div>
        </div>
        <p className="mt-6">
          <Link href={localizedPath(locale, "/quote")}>{t("common.cta.quote")}</Link>
        </p>
      </section>
    </PageShell>
  );
}
