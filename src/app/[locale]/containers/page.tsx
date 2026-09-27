import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContainerGroupCards } from "@/components/hub-cards";
import { LongformPage } from "@/components/longform";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/containers", "containers");
}

export default async function ContainersHubPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <LongformPage
      locale={locale}
      route="/containers"
      pageKey="containers"
      slots={{ groups: <ContainerGroupCards locale={locale} /> }}
    />
  );
}
