import { JsonLdScript } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { aggregateRating, allTestimonials, publishedTestimonials } from "@/lib/testimonials/testimonials";
import { buildTestimonialsJsonLd, type ReviewFacts } from "@/lib/structured-data";
import type { Locale } from "@/i18n/pathnames";

/** FR quotes take guillemets with non-breaking spaces; EN takes curly quotes (matches ClientStories). */
function quoted(text: string, locale: Locale): string {
  return locale === "fr" ? `« ${text} »` : `“${text}”`;
}

/**
 * Owner-editable social proof: published testimonials from
 * content/testimonials.json, rendered as quotes and emitted as schema.org Review
 * nodes (with a rating ONLY where one is really present — §1). With none
 * published the section does not exist. Reusable: drop it on any page with a
 * locale and a heading.
 */
export async function Testimonials({ locale, heading }: { locale: Locale; heading: string }) {
  const { t } = await getCopy(locale, "common");
  const testimonials = publishedTestimonials(allTestimonials, locale);
  if (testimonials.length === 0) return null;

  const orgId = `${absoluteUrl("/")}#organization`;
  const reviews: ReviewFacts[] = testimonials.map((item) => ({
    body: item.quote,
    author: item.author,
    company: item.company,
    datePublished: item.date,
    rating: item.rating,
  }));
  const jsonLd = buildTestimonialsJsonLd(reviews, orgId, aggregateRating(testimonials));

  return (
    <section className="wrap section-tight" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading">{heading}</h2>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {testimonials.map((item) => (
          <li key={item.id} className="placard flex flex-col gap-4 p-5 sm:p-6">
            <figure className="flex flex-1 flex-col">
              {item.rating !== null && (
                <p className="text-qc" aria-label={t("testimonialRating", { rating: String(item.rating) })}>
                  <span aria-hidden="true">
                    {"★".repeat(item.rating)}
                    {"☆".repeat(Math.max(0, 5 - item.rating))}
                  </span>
                </p>
              )}
              <blockquote className="flex-1 text-[1.25rem] leading-snug">
                <p>{quoted(item.quote, locale)}</p>
              </blockquote>
              <figcaption className="mt-4 text-graphite">
                <span className="font-semibold text-ink">{item.author}</span>
                {item.role ? `, ${item.role}` : null}
                {item.company ? `, ${item.company}` : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {jsonLd && <JsonLdScript data={jsonLd} />}
    </section>
  );
}
