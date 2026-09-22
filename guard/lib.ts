// Plain-text guards shared by the site's verification scripts and the video run.
// No Node APIs, no DOM, no imports: callers pass text and the JSON rule files.
// Passing a guard proves WORDING only. It never proves anything legal (§4).

export type GuardLocale = "fr" | "en";

export interface StaffingTerms {
  en: string[];
  fr: string[];
}

export interface RequiredFact {
  id: string;
  fact: string;
  /** Every inner list must be satisfied by at least one of its phrases. */
  allOf: string[][];
}

export interface RequiredPhrases {
  en: RequiredFact[];
  fr: RequiredFact[];
}

export interface TermHit {
  term: string;
  excerpt: string;
}

export interface FactResult {
  id: string;
  fact: string;
  ok: boolean;
  /** Inner lists (anyOf groups) with no matching phrase. */
  missing: string[][];
}

export interface NumberToken {
  raw: string;
  normalized: string;
}

export interface NumberHit extends NumberToken {
  excerpt: string;
}

const LETTER_OR_DIGIT = "[\\p{L}\\p{N}]";
const EXCERPT_RADIUS = 40;

/** Lowercase, strip accents, unify apostrophes, treat hyphens/dashes as spaces. */
export function normalizeText(input: string): string {
  return input
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[-‐‑‒–—−]/g, " ")
    .replace(/[\s   ]+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Regex matching a normalized phrase on word boundaries (letters/digits). */
export function phrasePattern(phrase: string): RegExp {
  const body = normalizeText(phrase).split(" ").map(escapeRegExp).join("\\s+");
  return new RegExp(`(?<!${LETTER_OR_DIGIT})${body}(?!${LETTER_OR_DIGIT})`, "u");
}

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(text.length, index + length + EXCERPT_RADIUS);
  return `…${text.slice(start, end)}…`;
}

export function containsPhrase(text: string, phrase: string): boolean {
  return phrasePattern(phrase).test(normalizeText(text));
}

/** D16(b): staffing terms present in `text` for the given locale's list. */
export function findStaffingTerms(
  text: string,
  terms: StaffingTerms,
  locale: GuardLocale,
): TermHit[] {
  const haystack = normalizeText(text);
  return terms[locale].flatMap((term) => {
    const match = phrasePattern(term).exec(haystack);
    return match ? [{ term, excerpt: excerptAround(haystack, match.index, match[0].length) }] : [];
  });
}

/** D16(a): which of the four Second Shift facts `text` presents. */
export function checkRequiredFacts(
  text: string,
  required: RequiredPhrases,
  locale: GuardLocale,
): FactResult[] {
  const haystack = normalizeText(text);
  return required[locale].map(({ id, fact, allOf }) => {
    const missing = allOf.filter(
      (anyOf) => !anyOf.some((phrase) => phrasePattern(phrase).test(haystack)),
    );
    return { id, fact, ok: missing.length === 0, missing };
  });
}

/** True when `text` names the service in any of the given names. */
export function mentionsService(text: string, names: string[]): boolean {
  return names.some((name) => containsPhrase(text, name));
}

// A digit-run, with thousands/decimal separators folded in: "5,000", "3.5",
// "4,25", "5 000" (space only when followed by exactly three digits).
const NUMBER_PATTERN = /\d+(?:(?:[.,]|[   ](?=\d{3}(?!\d)))\d+)*/g;

/** Separators removed, so "3.5" and "3,5" compare equal ("35"). */
export function normalizeNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function extractNumbers(text: string): NumberToken[] {
  return Array.from(text.matchAll(NUMBER_PATTERN), (m) => ({
    raw: m[0],
    normalized: normalizeNumber(m[0]),
  }));
}

/** Every string (and number) value in a JSON tree, keys excluded. */
export function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
  }
  return [];
}

/** NC-3 allowed set: numbers found in content values plus the allowlist. */
export function buildAllowedNumbers(
  contentValues: unknown[],
  allowlist: string[],
): Set<string> {
  const fromContent = contentValues
    .flatMap(collectStrings)
    .flatMap((s) => extractNumbers(s).map((n) => n.normalized));
  return new Set([...fromContent, ...allowlist.map(normalizeNumber)]);
}

/** NC-3: numbers in `text` that no content file or allowlist line accounts for. */
export function findInventedNumbers(text: string, allowed: Set<string>): NumberHit[] {
  return Array.from(text.matchAll(NUMBER_PATTERN))
    .filter((m) => !allowed.has(normalizeNumber(m[0])))
    .map((m) => ({
      raw: m[0],
      normalized: normalizeNumber(m[0]),
      excerpt: excerptAround(text, m.index ?? 0, m[0].length),
    }));
}
