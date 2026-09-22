import Link from "next/link";
import { Placard } from "@/components/placard";
import { fillMethods, services } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/i18n/pathnames";

/**
 * The two services as two pallet labels. The Second Shift label is a D16
 * surface: it carries all four facts and is checked by the guard.
 */
export async function ServicePlacards({
  locale,
  headingLevel = "h3",
  showNameNote = false,
}: {
  locale: Locale;
  headingLevel?: "h2" | "h3";
  showNameNote?: boolean;
}) {
  const { t } = await getCopy(locale);
  const ss = services.secondShift;
  const bn = services.bottleneck;
  const nameNote = bn.nameNote?.[locale];

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Placard
        guard="second-shift"
        headingLevel={headingLevel}
        title={ss.name[locale]}
        where={ss.where[locale]}
        fields={[
          { name: t("common.fields.buy"), value: t("services.ss.buy") },
          { name: t("common.fields.directedBy"), value: t("services.ss.directedBy") },
          { name: t("common.fields.doneBy"), value: t("services.ss.doneBy") },
          { name: t("common.fields.documentedBy"), value: t("services.ss.documentedBy") },
          { name: t("common.fields.billed"), value: t("services.ss.billed") },
        ]}
        footer={
          <Link href={localizedPath(locale, "/services/second-shift")}>{t("services.ss.more")}</Link>
        }
      />
      <Placard
        headingLevel={headingLevel}
        title={bn.name[locale]}
        where={bn.where[locale]}
        fields={[
          { name: t("common.fields.buy"), value: t("services.bn.buy") },
          { name: t("common.fields.fillPack"), value: t("services.bn.fillPack") },
          { name: t("common.fields.blending"), value: t("services.bn.blending") },
          {
            name: t("common.fields.fillMethods"),
            value: fillMethods.map((m) => m.name[locale]).join(", "),
          },
        ]}
        footer={
          <>
            <Link href={localizedPath(locale, "/services/contract-packaging")}>
              {t("services.bn.moreFill")}
            </Link>
            <Link href={localizedPath(locale, "/services/toll-blending")}>
              {t("services.bn.moreBlend")}
            </Link>
          </>
        }
      >
        {showNameNote && nameNote && (
          <p className="border-b border-hairline px-4 py-3 text-[0.9375rem] text-graphite sm:px-5">
            {nameNote}
          </p>
        )}
      </Placard>
    </div>
  );
}
