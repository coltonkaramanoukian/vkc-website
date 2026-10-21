import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CtaBand } from "@/components/cta-band";
import { HubCards } from "@/components/hub-cards";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { RelatedPages } from "@/components/related-pages";
import { ServiceJsonLd } from "@/components/service-json-ld";
import { getCopy } from "@/lib/i18n";
import { ROUTE_PICTO } from "@/lib/related";
import { pageMetadata } from "@/lib/seo";
import { isLocale, localizedPath, type AppPathname } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

// The service the cold-call pitch names, on a page of its own. It reads top
// to bottom as the pitch does: what it is, what VKC takes on, the two ways
// to reach us, then its two jobs. No Second Shift mention in main: naming it
// here would make the page a §4 surface that owes all four facts.
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/services/bottleneck", "bottleneck");
}

export default async function BottleneckPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale);
  const route: AppPathname = "/services/bottleneck";
  return (
    <PageShell locale={locale} route={route}>
      <section className="wrap pb-10 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route={route} />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{t("pages.bottleneck.eyebrow")}</p>
            <h1 className="mt-4 max-w-[22ch]">{t("pages.bottleneck.h1")}</h1>
            <p className="lead mt-5">{t("pages.bottleneck.lead")}</p>
            <p className="mt-5 font-bold">{t("pages.bottleneck.scope")}</p>
            <p className="mt-3 italic">{t("pages.bottleneck.slogan")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={localizedPath(locale, "/quote")} className="btn btn-primary">
                {t("common.cta.quote")}
              </Link>
              <Link href={localizedPath(locale, "/contact")} className="btn btn-secondary">
                {t("pages.bottleneck.contact")}
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <Pictogram name={ROUTE_PICTO[route] ?? "facility"} className="page-picto" />
          </div>
        </div>
      </section>

      <section className="wrap mt-14" aria-labelledby="bottleneck-jobs">
        <hr className="fill-rule mb-8" />
        <h2 id="bottleneck-jobs">{t("pages.bottleneck.jobsHeading")}</h2>
        <div className="mt-6">
          <HubCards
            locale={locale}
            cards={[
              {
                route: "/services/contract-packaging",
                title: t("common.nav.contractPackaging"),
                body: t("pages.services.cards.contractPackaging"),
                picto: "facility",
              },
              {
                route: "/services/toll-blending",
                title: t("common.nav.tollBlending"),
                body: t("pages.services.cards.tollBlending"),
                picto: "blend",
              },
            ]}
          />
        </div>
      </section>

      <ServiceJsonLd locale={locale} route={route} service="bottleneck" />
      <div className="mt-14">
        <RelatedPages locale={locale} route={route} />
      </div>
      <CtaBand locale={locale} />
    </PageShell>
  );
}
