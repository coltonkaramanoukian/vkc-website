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

/** JSON for a <script type="application/ld+json">: `<` escaped so a value can never close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
