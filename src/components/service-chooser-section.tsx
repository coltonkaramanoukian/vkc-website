import { ServiceChooser, type ChooserCopy } from "@/components/service-chooser";
import { RESULT_ROUTE, type Recommendation } from "@/lib/chooser";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/i18n/pathnames";

/** Server wrapper: hands the client chooser only its strings and routes. */
export async function ServiceChooserSection({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "home.chooser");
  const copy = (await getCopy(locale)).raw<ChooserCopy>("home.chooser");
  const hrefs = Object.fromEntries(
    (Object.keys(RESULT_ROUTE) as Recommendation[]).map((key) => [key, localizedPath(locale, RESULT_ROUTE[key])]),
  ) as Record<Recommendation, string>;

  return (
    <section className="wrap section-tight" aria-labelledby="chooser-heading">
      <div className="placard p-5 sm:p-8 lg:p-10">
        <div className="section-head">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="chooser-heading">{t("heading")}</h2>
          <p className="text-graphite">{t("intro")}</p>
        </div>
        <div className="mt-8">
          <ServiceChooser copy={copy} hrefs={hrefs} />
        </div>
      </div>
    </section>
  );
}
