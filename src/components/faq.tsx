import { Inline } from "@/components/longform";
import { JsonLdScript } from "@/components/json-ld";
import { buildFaqJsonLd, type FaqItem } from "@/lib/structured-data";
import type { Locale } from "@/i18n/pathnames";

/**
 * Questions as <details>: open without JavaScript, one at a time is the
 * reader's call. The same items feed FAQPage JSON-LD, so a crawler reads
 * exactly what a reader reads (and the guards scan both).
 */
export function Faq({
  locale,
  eyebrow,
  heading,
  items,
  id = "faq",
}: {
  locale: Locale;
  eyebrow: string;
  heading: string;
  items: FaqItem[];
  id?: string;
}) {
  return (
    <section className="wrap section" aria-labelledby={`${id}-heading`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
        <div className="section-head">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-heading`}>{heading}</h2>
        </div>
        <div>
          {items.map((item) => (
            <details key={item.q} className="disclosure">
              <summary className="disclosure-summary">
                <span>
                  <Inline text={item.q} locale={locale} />
                </span>
                <span className="disclosure-mark" aria-hidden="true" />
              </summary>
              <div className="disclosure-body">
                <p>
                  <Inline text={item.a} locale={locale} />
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
      <JsonLdScript data={buildFaqJsonLd(items)} />
    </section>
  );
}
