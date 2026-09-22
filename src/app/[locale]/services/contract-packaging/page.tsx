import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContainerList } from "@/components/container-list";
import { LongformPage } from "@/components/longform";
import { PhotoRow } from "@/components/photo";
import { SpecGrid } from "@/components/spec-grid";
import { capabilities } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/services/contract-packaging", "contractPackaging");
}

export default async function ContractPackagingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale, "common.specLabels");
  const c = capabilities;
  return (
    <LongformPage
      locale={locale}
      route="/services/contract-packaging"
      pageKey="contractPackaging"
      hero={<PhotoRow ids={["contract-packaging-line"]} locale={locale} />}
      slots={{
        containers: <ContainerList locale={locale} groups={["bottles-and-jugs", "pails", "kits"]} linkGroups />,
      }}
      after={
        <SpecGrid
          locale={locale}
          title={t("title")}
          rows={[
            { label: t("minimumRunSize"), value: c.minimumRunSize },
            { label: t("maximumRunSize"), value: c.maximumRunSize },
            { label: t("fillSizesOffered"), value: c.fillSizesOffered },
            { label: t("viscosityRange"), value: c.viscosityRange },
            { label: t("leadTime"), value: c.leadTime },
            { label: t("fillers"), value: c.equipment.fillers },
            { label: t("cappers"), value: c.equipment.cappers },
            { label: t("tijLidPrinters"), value: c.equipment.tijLidPrinters },
            { label: t("scales"), value: c.equipment.scales },
          ]}
        />
      }
    />
  );
}
