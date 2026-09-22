import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContainerPage } from "@/components/container-page";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/containers/bottles-and-jugs", "bottlesAndJugs");
}

export default async function BottlesAndJugsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <ContainerPage
      locale={locale}
      route="/containers/bottles-and-jugs"
      pageKey="bottlesAndJugs"
      group="bottles-and-jugs"
      photoId="bottles-and-jugs"
      specs={["fillSizesOffered", "viscosityRange", "fillers", "cappers"]}
    />
  );
}
