// The save boundary for testimonials. Like validate.ts / pricing.ts: nothing is
// trusted from the client, each testimonial is rebuilt field by field, and every
// human-written string runs through the same staffing (§4) / claims (§1) matchers
// the published guards use — so a customer quote containing a forbidden
// superlative (even in their words) is refused, exactly as the site never makes
// that claim. Testimonials render in SSR, so the build guards also scan the
// published ones; this gate catches a bad draft before it can be published.

import type { Localized } from "../content.ts";
import type { Testimonial } from "../testimonials/testimonials.ts";
import { coerceLocalized, coerceString, constitutionProblems, type FieldError } from "./validate.ts";

export interface PreparedTestimonials {
  ok: boolean;
  errors: FieldError[];
  testimonials?: Testimonial[];
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

function localizedProblems(path: string, value: Localized, index: number, push: (e: FieldError) => void) {
  if (value.en) for (const m of constitutionProblems(value.en, ["en"])) push({ path, index, message: m });
  if (value.fr) for (const m of constitutionProblems(value.fr, ["fr"])) push({ path, index, message: m });
}

function coerceRating(raw: unknown): { value: number | null; error: boolean } {
  if (raw === null || raw === undefined || raw === "") return { value: null, error: false };
  const parsed = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return { value: null, error: true };
  return { value: parsed, error: false };
}

/** Validate and shape the submitted rows into canonical testimonials. */
export function prepareTestimonials(submitted: unknown): PreparedTestimonials {
  const data = submitted && typeof submitted === "object" ? (submitted as Record<string, unknown>) : {};
  const rows = Array.isArray(data.testimonials) ? data.testimonials : [];
  const errors: FieldError[] = [];
  const testimonials: Testimonial[] = [];
  const seen = new Set<string>();

  rows.forEach((raw, index) => {
    const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const push = (e: FieldError) => errors.push(e);

    const author = coerceString(row.author);
    const quote = coerceLocalized(row.quote);
    // A row with no author and no quote is an empty row — dropped, not an error.
    if (!author && !quote.en && !quote.fr) return;

    let id = coerceString(row.id) ?? "";
    if (id && !SLUG.test(id)) push({ path: "id", index, message: "Use lowercase letters, numbers and hyphens only." });
    if (!id) id = `testimonial-${index + 1}`;
    if (seen.has(id)) push({ path: "id", index, message: `Another testimonial already uses the id “${id}”.` });
    seen.add(id);

    const published = row.published === true;
    const company = coerceString(row.company);
    const role = coerceLocalized(row.role);
    const date = coerceString(row.date);
    if (date && (!DATE.test(date) || !isRealDate(date))) {
      push({ path: "date", index, message: "Use a real date in YYYY-MM-DD form, or leave it blank." });
    }
    const { value: rating, error: ratingError } = coerceRating(row.rating);
    if (ratingError) push({ path: "rating", index, message: "A rating must be a whole number from 1 to 5, or blank." });

    if (author) for (const m of constitutionProblems(author, ["en", "fr"])) push({ path: "author", index, message: m });
    if (company) for (const m of constitutionProblems(company, ["en", "fr"])) push({ path: "company", index, message: m });
    localizedProblems("quote", quote, index, push);
    localizedProblems("role", role, index, push);

    // A published testimonial must be renderable: an author and a quote in both languages (§3).
    if (published && !(author && quote.en && quote.fr)) {
      push({ path: "published", index, message: "A published testimonial needs an author and a quote in both English and French." });
    }

    testimonials.push({ id, published, quote, author: author ?? "", company, role, date, rating });
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], testimonials };
}
