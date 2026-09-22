import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContainerList } from "@/components/container-list";
import { LongformPage } from "@/components/longform";
import { ServicePlacards } from "@/components/service-placards";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/industries/cleaners", "cleaners");
}

export default async function CleanersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <LongformPage
      locale={locale}
      route="/industries/cleaners"
      pageKey="cleaners"
      slots={{
        containers: <ContainerList locale={locale} groups={["bottles-and-jugs", "pails"]} linkGroups />,
        services: <ServicePlacards locale={locale} shared />,
      }}
    />
  );
}
