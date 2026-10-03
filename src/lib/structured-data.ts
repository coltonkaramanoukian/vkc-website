// Structured-data builders. Pure functions over strings: the page decides what
// goes in, and everything that goes in is copy the page already renders, so a
// guard that reads the JSON-LD sees exactly what a reader sees (§1, §4).

export interface FaqItem {
  q: string;
  a: string;
}

export interface Crumb {
  name: string;
  url: string;
}

const INLINE_LINK = /\[([^\]]+)\]\([^)]*\)/g;

/** Plain text for an answer that may carry an inline `[label](/route)` link. */
export function plainText(text: string): string {
  return text.replace(INLINE_LINK, "$1");
}

export function buildFaqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: plainText(item.q),
      acceptedAnswer: { "@type": "Answer", text: plainText(item.a) },
    })),
  };
}

/** BreadcrumbList: every item linked except the current page. */
export function buildBreadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(index < crumbs.length - 1 ? { item: crumb.url } : {}),
    })),
  };
}

export interface ServiceFacts {
  name: string;
  /** The service summary from content/services.json: for Second Shift it carries all four facts (§4). */
  description: string;
  url: string;
  providerId: string;
}

/** schema.org Service for a service page; the description is content, never copy. */
export function buildServiceJsonLd(facts: ServiceFacts): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: facts.name,
    serviceType: facts.name,
    description: facts.description,
    url: facts.url,
    provider: { "@id": facts.providerId },
  };
}

/** schema.org ContactPage: names the page and points at the organization. Contact facts stay in the Organization block. */
export function buildContactPageJsonLd(facts: { name: string; url: string; organizationId: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: facts.name,
    url: facts.url,
    about: { "@id": facts.organizationId },
  };
}

export interface DefinedTermEntry {
  term: string;
  definition: string;
  /** Fragment on the glossary page, e.g. "weigh-fill". */
  slug: string;
}

/** schema.org DefinedTermSet for the glossary: every definition, plain text, anchored to its entry. */
export function buildDefinedTermSetJsonLd(facts: { name: string; url: string; terms: DefinedTermEntry[] }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${facts.url}#terms`,
    name: facts.name,
    url: facts.url,
    hasDefinedTerm: facts.terms.map((entry) => ({
      "@type": "DefinedTerm",
      name: entry.term,
      description: plainText(entry.definition),
      url: `${facts.url}#${entry.slug}`,
      inDefinedTermSet: { "@id": `${facts.url}#terms` },
    })),
  };
}

export interface ArticleFacts {
  headline: string;
  description: string;
  url: string;
  /** YYYY-MM-DD. */
  datePublished: string;
  /** "fr-CA" | "en-CA". */
  inLanguage: string;
  /** The Organization @id (single-company site: VKC authors and publishes). */
  organizationId: string;
  /** Absolute image URL, when the post has a cover. */
  image?: string | null;
}

/** schema.org Article for a blog post. Every value is copy the page renders (§1). */
export function buildArticleJsonLd(facts: ArticleFacts): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: facts.headline,
    description: facts.description,
    url: facts.url,
    mainEntityOfPage: facts.url,
    datePublished: facts.datePublished,
    inLanguage: facts.inLanguage,
    author: { "@id": facts.organizationId },
    publisher: { "@id": facts.organizationId },
    ...(facts.image ? { image: facts.image } : {}),
  };
}

export interface ReviewFacts {
  /** The testimonial text. */
  body: string;
  author: string;
  company?: string | null;
  /** YYYY-MM-DD, when present. */
  datePublished?: string | null;
  /** A real 1–5 rating; omit/null to emit no reviewRating (§1: no invented stars). */
  rating?: number | null;
}

export interface AggregateRatingFacts {
  ratingValue: number;
  ratingCount: number;
  reviewCount: number;
}

function reviewNode(facts: ReviewFacts, itemReviewedId: string): Record<string, unknown> {
  const author: Record<string, unknown> = { "@type": "Person", name: facts.author };
  if (facts.company) author.worksFor = { "@type": "Organization", name: facts.company };
  return {
    "@type": "Review",
    reviewBody: facts.body,
    author,
    itemReviewed: { "@id": itemReviewedId },
    ...(facts.datePublished ? { datePublished: facts.datePublished } : {}),
    ...(typeof facts.rating === "number"
      ? { reviewRating: { "@type": "Rating", ratingValue: facts.rating, bestRating: 5, worstRating: 1 } }
      : {}),
  };
}

/**
 * schema.org Review nodes for published testimonials, plus — only when real
 * ratings exist — an AggregateRating merged onto the Organization by @id. Every
 * value is copy the page renders; a rating appears only when a testimonial
 * actually carries one (§1). Returns null when there is nothing to emit.
 */
export function buildTestimonialsJsonLd(
  reviews: ReviewFacts[],
  itemReviewedId: string,
  aggregate?: AggregateRatingFacts | null,
): Record<string, unknown> | null {
  if (reviews.length === 0) return null;
  const graph: Record<string, unknown>[] = reviews.map((review) => reviewNode(review, itemReviewedId));
  if (aggregate) {
    graph.push({
      "@type": "Organization",
      "@id": itemReviewedId,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregate.ratingValue,
        ratingCount: aggregate.ratingCount,
        reviewCount: aggregate.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/** JSON for a <script type="application/ld+json">: `<` escaped so a value can never close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
