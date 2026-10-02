// Owner-editable social proof. Stored in one top-level content/testimonials.json
// array (like content/articles.json) so the number guard — which reads
// content/*.json non-recursively — allows any date/rating a testimonial carries.
// §1: a testimonial names a real person and company, so nothing renders until
// `published: true`, and the admin save gate holds it to the same
// written-permission standard as an approved client (see lib/admin/testimonials.ts
// and NEEDS-COLTON §14). No testimonial, name or rating is ever invented.

import testimonialsJson from "../../../content/testimonials.json" with { type: "json" };
import type { Localized } from "../content.ts";
import type { Locale } from "@/i18n/pathnames";

export interface Testimonial {
  id: string;
  published: boolean;
  quote: Localized;
  author: string;
  company: string | null;
  role: Localized;
  /** ISO date (YYYY-MM-DD) or null. */
  date: string | null;
  /** A real 1–5 rating, or null. NEVER invent one (§1): null renders no stars and no AggregateRating. */
  rating: number | null;
}

/** One testimonial resolved for a locale, ready to render. */
export interface ResolvedTestimonial {
  id: string;
  quote: string;
  author: string;
  company: string | null;
  role: string | null;
  date: string | null;
  rating: number | null;
}

export const allTestimonials: Testimonial[] = testimonialsJson as Testimonial[];

function filled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** The locale's text only when BOTH languages are written (§3), else null. */
function bothLanguages(value: Localized | null | undefined, locale: Locale): string | null {
  if (!value || !filled(value.en) || !filled(value.fr)) return null;
  return (value[locale] ?? "").trim();
}

/**
 * Published testimonials with a quote written in both languages, resolved to the
 * locale. A testimonial missing either language renders nothing rather than half
 * a quote. Role is optional; it shows only when written in both languages too.
 */
export function publishedTestimonials(clients: readonly Testimonial[], locale: Locale): ResolvedTestimonial[] {
  return clients
    .filter((t) => t.published === true && filled(t.author))
    .map((t) => ({ t, quote: bothLanguages(t.quote, locale) }))
    .filter((x): x is { t: Testimonial; quote: string } => x.quote !== null)
    .map(({ t, quote }) => ({
      id: t.id,
      quote,
      author: t.author.trim(),
      company: filled(t.company) ? t.company.trim() : null,
      role: bothLanguages(t.role, locale),
      date: filled(t.date) ? t.date : null,
      rating: typeof t.rating === "number" && t.rating > 0 ? t.rating : null,
    }));
}

/** Factual AggregateRating inputs over the rated testimonials, or null when none carry a rating (§1). */
export function aggregateRating(
  testimonials: readonly ResolvedTestimonial[],
): { ratingValue: number; ratingCount: number; reviewCount: number } | null {
  const rated = testimonials.filter((t) => typeof t.rating === "number");
  if (rated.length === 0) return null;
  const sum = rated.reduce((total, t) => total + (t.rating ?? 0), 0);
  const ratingValue = Math.round((sum / rated.length) * 10) / 10;
  return { ratingValue, ratingCount: rated.length, reviewCount: testimonials.length };
}
