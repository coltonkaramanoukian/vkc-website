// Glossary ordering: pure, so the per-locale sort and the letter groups can
// be tested without rendering. The component only lays out what this returns.
import { uniqueSlugs } from "./slug.ts";
import type { Locale } from "../i18n/pathnames";

export interface GlossaryTerm {
  term: string;
  def: string;
}

export interface GlossaryEntry extends GlossaryTerm {
  /** Anchor id on the page, unique within the list. */
  slug: string;
  /** Upper-case first letter with accents folded: "Étiquette" → "E". */
  letter: string;
}

const COLLATOR_LOCALE: Record<Locale, string> = { fr: "fr-CA", en: "en-CA" };

/** First letter of a term, accents folded, upper-cased, for grouping. */
export function letterOf(term: string): string {
  return term
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .trim()
    .charAt(0)
    .toUpperCase();
}

/**
 * Sort terms in the locale's own alphabetical order (accent- and
 * case-insensitive) and stamp each with its anchor and letter. Returns a new
 * array; the input is not touched.
 */
export function orderTerms(terms: readonly GlossaryTerm[], locale: Locale): GlossaryEntry[] {
  const collator = new Intl.Collator(COLLATOR_LOCALE[locale], { sensitivity: "base" });
  const sorted = [...terms].sort((a, b) => collator.compare(a.term, b.term));
  const slugs = uniqueSlugs(sorted.map((entry) => entry.term));
  return sorted.map((entry, index) => ({ ...entry, slug: slugs[index], letter: letterOf(entry.term) }));
}

/** The letters that appear, in order of first appearance in the ordered list. */
export function lettersOf(entries: readonly GlossaryEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.letter))];
}

/** Anchor id for a letter group: "S" → "letter-s". */
export function letterAnchor(letter: string): string {
  return `letter-${letter.toLowerCase()}`;
}
