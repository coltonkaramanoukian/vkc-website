import Link from "next/link";
import { Pictogram } from "@/components/pictograms";
import { getCopy } from "@/lib/i18n";
import { navLabelKey, pageKeyFor } from "@/lib/nav";
import { RELATED, ROUTE_PICTO } from "@/lib/related";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/**
 * "Keep reading": three hand-picked pages, each as a linked label with its
 * pictogram, title and eyebrow. Marked shared: it is site furniture, not
 * the page's own copy.
 */
export async function RelatedPages({ locale, route }: { locale: Locale; route: AppPathname }) {
  const targets = RELATED[route];
  if (!targets || targets.length === 0) return null;
  const { t } = await getCopy(locale);

  const cards = targets.map((target) => {
    const labelKey = navLabelKey(target);
    const isHub = ["/services", "/containers", "/industries"].includes(target);
    const title = isHub ? t(`common.groups.${labelKey}`) : t(`common.nav.${labelKey}`);
    const eyebrow = t(`pages.${pageKeyFor(target)}.eyebrow`);
    return { target, title, eyebrow, picto: ROUTE_PICTO[target] ?? "clipboard" };
  });

  return (
    <section className="wrap section-tight" aria-labelledby="related-heading" data-shared="related">
      <p className="eyebrow">{t("common.related")}</p>
      <h2 id="related-heading" className="mt-3 text-[1.5rem] sm:text-[1.75rem]">
        {t("common.relatedHeading")}
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.target}>
            <Link href={localizedPath(locale, card.target)} className="placard placard-link flex h-full gap-4 p-5">
              <Pictogram name={card.picto} className="shrink-0" />
              <span className="min-w-0">
                <span className="field-name block">{card.eyebrow}</span>
                <span className="placard-title mt-1 block text-[1.125rem] font-bold leading-snug">{card.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
