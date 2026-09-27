import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/i18n/pathnames";

/**
 * The day as a plant runs it, drawn as one bar: the shifts you cover, and
 * the one VKC runs. Abstract on purpose — which shift, and how many, is the
 * quote's business, not a drawing's.
 */
export async function ShiftBar({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "pages.secondShift.shiftBar");
  return (
    <figure className="shift-bar" aria-label={t("caption")}>
      <div className="shift-bar-track" aria-hidden="true">
        <div className="shift-seg shift-seg-yours" />
        <div className="shift-seg shift-seg-ours" />
        <div className="shift-seg shift-seg-yours" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[0.8125rem]" aria-hidden="true">
        <p className="text-graphite">{t("yours")}</p>
        <p className="text-center font-bold text-ink">{t("ours")}</p>
        <p className="text-right text-graphite">{t("yours")}</p>
      </div>
      <figcaption className="field-name mt-3">{t("caption")}</figcaption>
    </figure>
  );
}
