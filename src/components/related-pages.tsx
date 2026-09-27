import Link from "next/link";
import { Pictogram } from "@/components/pictograms";
import { getCopy } from "@/lib/i18n";
import { navLabelKey, pageKeyFor } from "@/lib/nav";
import { RELATED, ROUTE_PICTO } from "@/lib/related";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/**
 * "Where this leads next": three hand-picked pages as three ruled cells
 * under one hairline, each with its pictogram, its category and its title.
 * Not placards: a placard holds a fact, a rule points somewhere. Marked
 * shared: it is site furniture, not the page's own copy.
 */
export async function RelatedPages({ locale, route }: { locale: Locale; route: AppPathname }) {
  const targets = RELATED[route];
  if (!targets || targets.length === 0) return null;
  const { t, raw } = await getCopy(locale);
  // Long-form pages keep their copy under pages.<key>; the quote page keeps
  // its own namespace (quote.*). Either way the cell wants the eyebrow.
  const pages = raw<Record<string, { eyebrow?: string } | undefined>>("pages");

  const cards = targets.map((target) => {
    const labelKey = navLabelKey(target);
    const isHub = ["/services", "/containers", "/industries"].includes(target);
    const title = isHub ? t(`common.groups.${labelKey}`) : t(`common.nav.${labelKey}`);
    const key = pageKeyFor(target);
    const eyebrow = pages[key]?.eyebrow ?? t(`${key}.eyebrow`);
    return { target, title, eyebrow, picto: ROUTE_PICTO[target] ?? "clipboard" };
  });

  return (
    <section className="wrap section-tight" aria-labelledby="related-heading" data-shared="related">
      <h2 id="related-heading" className="text-[1.5rem] sm:text-[1.75rem]">
        {t("common.relatedHeading")}
      </h2>
      <ul className="ruled-cells mt-6">
        {cards.map((card) => (
          <li key={card.target}>
            <Link href={localizedPath(locale, card.target)} className="ruled-cell">
              <Pictogram name={card.picto} />
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
