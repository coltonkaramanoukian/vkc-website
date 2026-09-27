import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HubCards } from "@/components/hub-cards";
import { LongformPage } from "@/components/longform";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/industries", "industries");
}

export default async function IndustriesHubPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale);
  return (
    <LongformPage
      locale={locale}
      route="/industries"
      pageKey="industries"
      slots={{
        trades: (
          <HubCards
            locale={locale}
            cards={[
              {
                route: "/industries/cleaners",
                title: t("common.nav.cleaners"),
                body: t("pages.industries.cards.cleaners"),
                picto: "spray",
              },
              {
                route: "/industries/lubricants",
                title: t("common.nav.lubricants"),
                body: t("pages.industries.cards.lubricants"),
                picto: "oilcan",
              },
              {
                route: "/industries/sealers-and-coatings",
                title: t("common.nav.sealersCoatings"),
                body: t("pages.industries.cards.sealersCoatings"),
                picto: "roller",
              },
            ]}
          />
        ),
      }}
    />
  );
}
