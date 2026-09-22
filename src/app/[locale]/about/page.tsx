import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClientList } from "@/components/client-list";
import { LongformPage } from "@/components/longform";
import { PhotoRow } from "@/components/photo";
import { ServicePlacards } from "@/components/service-placards";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/about", "about");
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale, "common");
  return (
    <LongformPage
      locale={locale}
      route="/about"
      pageKey="about"
      hero={<PhotoRow ids={["about-floor"]} locale={locale} />}
      slots={{ services: <ServicePlacards locale={locale} shared /> }}
      after={<ClientList heading={t("clientsHeading")} />}
    />
  );
}
