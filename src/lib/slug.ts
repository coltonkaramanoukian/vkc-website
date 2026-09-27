// Anchor ids for section headings. Letters only in the suffix: the number
// guard allows no digit a reader can see, and an id can surface in a URL.

export function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

const SUFFIXES = "bcdefghijklmnopqrstuvwxyz";

/** Slugs for a list of headings, with a letter suffix on any repeat. */
export function uniqueSlugs(headings: string[]): string[] {
  const seen = new Map<string, number>();
  return headings.map((heading) => {
    const base = slugify(heading);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${SUFFIXES[Math.min(count - 1, SUFFIXES.length - 1)]}`;
  });
}
