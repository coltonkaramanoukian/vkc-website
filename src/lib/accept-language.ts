// D1/D17: pick fr or en from Accept-Language, falling back to fr. Pure.

export type SiteLocale = "fr" | "en";
const FALLBACK: SiteLocale = "fr";

interface Range {
  tag: string;
  q: number;
  order: number;
}

function parse(header: string): Range[] {
  return header
    .split(",")
    .map((part, order) => {
      const [tagPart, ...params] = part.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: tagPart.trim().toLowerCase(), q, order };
    })
    .filter((range) => range.tag !== "" && Number.isFinite(range.q) && range.q > 0);
}

export function negotiateLocale(header: string | null | undefined): SiteLocale {
  if (!header) return FALLBACK;
  const ranked = [...parse(header)].sort((a, b) => b.q - a.q || a.order - b.order);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "fr" || base === "en") return base;
  }
  return FALLBACK;
}
