import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LongformPage } from "@/components/longform";
import { ServicePlacards } from "@/components/service-placards";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/locations/montreal", "montreal");
}

export default async function MontrealPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <LongformPage
      locale={locale}
      route="/locations/montreal"
      pageKey="montreal"
      slots={{ services: <ServicePlacards locale={locale} shared /> }}
    />
  );
}
