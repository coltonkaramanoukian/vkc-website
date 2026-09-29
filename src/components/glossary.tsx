import { JsonLdScript } from "@/components/json-ld";
import { Inline } from "@/components/longform";
import { absoluteUrl } from "@/lib/content";
import { letterAnchor, lettersOf, orderTerms, type GlossaryTerm } from "@/lib/glossary";
import { getCopy } from "@/lib/i18n";
import { buildDefinedTermSetJsonLd } from "@/lib/structured-data";
import { localizedPath, type Locale } from "@/i18n/pathnames";

export type { GlossaryTerm } from "@/lib/glossary";

/**
 * The glossary: every term in the locale's own alphabetical order, grouped by
 * letter under a jump strip, as a definition list. The same entries feed a
 * DefinedTermSet, so a crawler reads exactly what a reader reads.
 */
export async function Glossary({ locale, terms, title }: { locale: Locale; terms: GlossaryTerm[]; title: string }) {
  const { t } = await getCopy(locale, "pages.glossary");
  const entries = orderTerms(terms, locale);
  const letters = lettersOf(entries);
  const pageUrl = absoluteUrl(localizedPath(locale, "/glossary"));

  return (
    <>
      <nav aria-label={t("lettersLabel")} className="wrap glossary-jump">
        <ol className="jump-nav">
          {letters.map((letter) => (
            <li key={letter}>
              <a href={`#${letterAnchor(letter)}`}>{letter}</a>
            </li>
          ))}
        </ol>
      </nav>

      {letters.map((letter) => (
        <section key={letter} id={letterAnchor(letter)} className="wrap mt-12 scroll-mt-[var(--vkc-jump-stick)]">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-10">
            <h2 className="glossary-letter">{letter}</h2>
            <dl className="glossary">
              {entries
                .filter((entry) => entry.letter === letter)
                .map((entry) => (
                  <div key={entry.slug} id={entry.slug} className="glossary-entry scroll-mt-[var(--vkc-jump-stick)]">
                    <dt>{entry.term}</dt>
                    <dd>
                      <Inline text={entry.def} locale={locale} />
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </section>
      ))}

      <JsonLdScript
        data={buildDefinedTermSetJsonLd({
          name: title,
          url: pageUrl,
          terms: entries.map((entry) => ({ term: entry.term, definition: entry.def, slug: entry.slug })),
        })}
      />
    </>
  );
}
