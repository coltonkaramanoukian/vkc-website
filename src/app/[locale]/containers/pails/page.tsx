import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContainerPage } from "@/components/container-page";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/containers/pails", "pails");
}

export default async function PailsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <ContainerPage
      locale={locale}
      route="/containers/pails"
      pageKey="pails"
      group="pails"
      photoId="pails"
      specs={["fillSizesOffered", "viscosityRange", "scales", "tijLidPrinters"]}
    />
  );
}
