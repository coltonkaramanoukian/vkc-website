import { JsonLdScript } from "@/components/json-ld";
import { Inline } from "@/components/longform";
import { absoluteUrl } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { uniqueSlugs } from "@/lib/slug";
import { buildDefinedTermSetJsonLd } from "@/lib/structured-data";
import { localizedPath, type Locale } from "@/i18n/pathnames";

export interface GlossaryTerm {
  term: string;
  def: string;
}

/** First letter of a term, accents folded, for the letter strip and the groups. */
function letterOf(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .charAt(0)
    .toUpperCase();
}

/**
 * The glossary: every term in the locale's own alphabetical order, grouped by
 * letter under a jump strip, as a definition list. The same entries feed a
 * DefinedTermSet, so a crawler reads exactly what a reader reads.
 */
export async function Glossary({ locale, terms, title }: { locale: Locale; terms: GlossaryTerm[]; title: string }) {
  const { t } = await getCopy(locale, "pages.glossary");
  const collator = new Intl.Collator(locale === "fr" ? "fr-CA" : "en-CA", { sensitivity: "base" });
  const sorted = [...terms].sort((a, b) => collator.compare(a.term, b.term));
  const slugs = uniqueSlugs(sorted.map((entry) => entry.term));
  const entries = sorted.map((entry, index) => ({ ...entry, slug: slugs[index], letter: letterOf(entry.term) }));
  const letters = [...new Set(entries.map((entry) => entry.letter))];
  const pageUrl = absoluteUrl(localizedPath(locale, "/glossary"));

  return (
    <>
      <nav aria-label={t("lettersLabel")} className="wrap">
        <ol className="jump-nav">
          {letters.map((letter) => (
            <li key={letter}>
              <a href={`#letter-${letter.toLowerCase()}`}>{letter}</a>
            </li>
          ))}
        </ol>
      </nav>

      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter.toLowerCase()}`} className="wrap mt-12 scroll-mt-24">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-10">
            <h2 className="glossary-letter">{letter}</h2>
            <dl className="glossary">
              {entries
                .filter((entry) => entry.letter === letter)
                .map((entry) => (
                  <div key={entry.slug} id={entry.slug} className="glossary-entry scroll-mt-24">
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
