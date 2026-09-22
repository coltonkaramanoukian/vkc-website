import { ContainerList } from "@/components/container-list";
import { LongformPage } from "@/components/longform";
import { PhotoRow } from "@/components/photo";
import { SpecGrid } from "@/components/spec-grid";
import { capabilities, type ContainerGroup, type Localized } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import type { AppPathname, Locale } from "@/i18n/pathnames";

type SpecKey = "minimumRunSize" | "fillSizesOffered" | "viscosityRange" | "leadTime";
type EquipmentKey = keyof typeof capabilities.equipment;

const specValue = (key: SpecKey | EquipmentKey): Localized =>
  key in capabilities.equipment
    ? capabilities.equipment[key as EquipmentKey]
    : capabilities[key as SpecKey];

/**
 * One container family page: copy from pages.<pageKey>, the family names from
 * content/containers.json, the photo slot, and the capability rows that apply
 * (each renders only once content/capabilities.json has a value).
 */
export async function ContainerPage({
  locale,
  route,
  pageKey,
  group,
  photoId,
  specs,
}: {
  locale: Locale;
  route: AppPathname;
  pageKey: string;
  group: ContainerGroup;
  photoId: string;
  specs: (SpecKey | EquipmentKey)[];
}) {
  const { t } = await getCopy(locale, "common.specLabels");
  return (
    <LongformPage
      locale={locale}
      route={route}
      pageKey={pageKey}
      hero={<PhotoRow ids={[photoId]} locale={locale} />}
      slots={{ containers: <ContainerList locale={locale} groups={[group]} /> }}
      after={
        <SpecGrid
          locale={locale}
          title={t("title")}
          rows={specs.map((key) => ({ label: t(key), value: specValue(key) }))}
        />
      }
    />
  );
}
