import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LongformPage } from "@/components/longform";
import { PhotoRow } from "@/components/photo";
import { SecondShiftPlacard } from "@/components/service-placards";
import { ShiftBar } from "@/components/shift-bar";
import { ServiceJsonLd } from "@/components/service-json-ld";
import { SpecGrid } from "@/components/spec-grid";
import { capabilities } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

// D16: never cut; every surface here carries all four facts (NC-2).
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/services/second-shift", "secondShift");
}

export default async function SecondShiftPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale, "common.specLabels");
  const ss = capabilities.secondShift;
  return (
    <LongformPage
      locale={locale}
      route="/services/second-shift"
      pageKey="secondShift"
      hero={
        <div className="space-y-8">
          <SecondShiftPlacard
            locale={locale}
            headingLevel="h2"
            showLink={false}
          />
          <ShiftBar locale={locale} />
          <PhotoRow
            ids={["second-shift-lead-hand", "second-shift-records"]}
            locale={locale}
          />
        </div>
      }
      after={
        <>
          <ServiceJsonLd
            locale={locale}
            route="/services/second-shift"
            service="secondShift"
          />
          <SpecGrid
            locale={locale}
            title={t("title")}
            rows={[
              { label: t("crewSize"), value: ss.crewSize },
              { label: t("shiftsOffered"), value: ss.shiftsOffered },
              { label: t("minimumCommitment"), value: ss.minimumCommitment },
              { label: t("insurance"), value: ss.insurance },
            ]}
          />
        </>
      }
    />
  );
}
