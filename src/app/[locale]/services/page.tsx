import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HubCards } from "@/components/hub-cards";
import { LongformPage } from "@/components/longform";
import { ServiceChooserSection } from "@/components/service-chooser-section";
import { CompareTable } from "@/components/compare-table";
import { BottleneckPlacard, SecondShiftPlacard } from "@/components/service-placards";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/services", "services");
}

export default async function ServicesHubPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale);
  return (
    <LongformPage
      locale={locale}
      route="/services"
      pageKey="services"
      slots={{
        secondShift: (
          <div className="max-w-3xl" data-shared="services">
            <SecondShiftPlacard locale={locale} />
          </div>
        ),
        bottleneck: (
          <div className="max-w-3xl" data-shared="services">
            <BottleneckPlacard locale={locale} showNameNote />
          </div>
        ),
        pages: (
          <HubCards
            locale={locale}
            cards={[
              {
                route: "/services/second-shift",
                title: t("common.nav.secondShift"),
                body: t("pages.services.cards.secondShift"),
                picto: "plant",
              },
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
        ),
        compare: <CompareTable locale={locale} />,
      }}
      after={<ServiceChooserSection locale={locale} />}
    />
  );
}
