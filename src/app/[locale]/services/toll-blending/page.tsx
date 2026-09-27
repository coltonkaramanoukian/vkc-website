import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LongformPage } from "@/components/longform";
import { PhotoRow } from "@/components/photo";
import { ServiceJsonLd } from "@/components/service-json-ld";
import { SpecGrid } from "@/components/spec-grid";
import { capabilities } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/services/toll-blending", "tollBlending");
}

export default async function TollBlendingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale, "common.specLabels");
  const c = capabilities;
  return (
    <LongformPage
      locale={locale}
      route="/services/toll-blending"
      pageKey="tollBlending"
      hero={<PhotoRow ids={["toll-blending-batch"]} locale={locale} />}
      after={
        <>
          <ServiceJsonLd
            locale={locale}
            route="/services/toll-blending"
            service="bottleneck"
          />
          <SpecGrid
            locale={locale}
            title={t("title")}
            rows={[
              { label: t("blendingBatchSizes"), value: c.blendingBatchSizes },
              { label: t("viscosityRange"), value: c.viscosityRange },
              { label: t("leadTime"), value: c.leadTime },
            ]}
          />
        </>
      }
    />
  );
}
