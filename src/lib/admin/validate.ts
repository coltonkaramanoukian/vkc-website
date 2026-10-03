// The save boundary. Nothing is trusted from the client: every field is coerced
// to its declared type, empties collapse to null (§1: a null renders nothing),
// and every human-written string is run through the SAME staffing (§4) and
// forbidden-claims (§1) matchers the published guards use — so the editor can
// never commit what `npm run guard:staffing` / `guard:claims` would later reject.
// The canonical object is built here from the schema, not from the client's
// shape, so a malformed payload can never corrupt content/*.json.

import forbiddenClaimsJson from "../../../guard/forbidden-claims.json" with { type: "json" };
import { findStaffingTerms, type GuardLocale, type StaffingTerms } from "../../../guard/lib.ts";
import staffingTermsJson from "../../../guard/staffing-terms.json" with { type: "json" };
import { setPath } from "./paths.ts";
import type { Field, Section } from "./sections.ts";

export interface FieldError {
  /** Field path within the section (or within a list entry). */
  path: string;
  /** Present for list sections: which entry (0-based). */
  index?: number;
  message: string;
}

export interface PrepareResult {
  ok: boolean;
  errors: FieldError[];
  /** The canonical content to persist (object for object sections, array for lists). Present only when ok. */
  content: unknown;
}

const STAFFING = staffingTermsJson as StaffingTerms;
const CLAIMS = forbiddenClaimsJson as { en: { term: string; why: string }[]; fr: { term: string; why: string }[] };
const CLAIM_TERMS: StaffingTerms = { en: CLAIMS.en.map((c) => c.term), fr: CLAIMS.fr.map((c) => c.term) };
const CLAIM_WHY = new Map([...CLAIMS.en, ...CLAIMS.fr].map((c) => [c.term, c.why]));

// Mirror scripts/guard-claims.ts: a word-boundary match inside a denial
// ("no certifications") is not a claim. Keep this in lockstep with that guard.
const NEGATION: Record<GuardLocale, RegExp> = {
  en: /\b(no|not|never|without|zero|nor)\s+(\w+\s+){0,2}$/i,
  fr: /\b(aucun|aucune|aucuns|aucunes|sans|jamais|ni|pas\s+de|pas\s+d)\s*(\w+\s+){0,2}$/i,
};

function isDenial(excerpt: string, term: string, locale: GuardLocale): boolean {
  const at = excerpt.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return false;
  return NEGATION[locale].test(excerpt.slice(Math.max(0, at - 40), at));
}

/** Every constitution problem in one human-written string, for the given locales. */
export function constitutionProblems(text: string, locales: GuardLocale[]): string[] {
  const problems: string[] = [];
  for (const locale of locales) {
    for (const hit of findStaffingTerms(text, STAFFING, locale)) {
      problems.push(`“${hit.term}” reads as staffing, not a service VKC controls (§4). Rephrase.`);
    }
    for (const hit of findStaffingTerms(text, CLAIM_TERMS, locale)) {
      if (isDenial(hit.excerpt, hit.term, locale)) continue;
      problems.push(`“${hit.term}” is a claim the site never makes — ${CLAIM_WHY.get(hit.term) ?? "not permitted"} (§1).`);
    }
  }
  // De-dupe: EN+FR lists share terms, and a plain field is checked in both.
  return Array.from(new Set(problems));
}

export function coerceString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function coerceLocalized(value: unknown): { en: string | null; fr: string | null } {
  const object = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return { en: coerceString(object.en), fr: coerceString(object.fr) };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatProblem(field: Field, value: string): string | null {
  switch (field.type) {
    case "email":
      return EMAIL.test(value) ? null : "That doesn’t look like an email address.";
    case "url":
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? null : "A website must start with http:// or https://.";
      } catch {
        return "That doesn’t look like a web address.";
      }
    case "tel": {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 ? null : "A phone number needs at least seven digits.";
    }
    case "number":
      return null; // handled by coerceNumber
    default:
      return null;
  }
}

function coerceNumber(value: unknown): { value: number | null; error: string | null } {
  if (value === null || value === undefined || value === "") return { value: null, error: null };
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0) return { value: null, error: "Enter a positive number, or leave it blank." };
  return { value: parsed, error: null };
}

/** Coerce one field's raw value and collect any problems; returns the value to persist. */
function processField(field: Field, raw: unknown, locales: GuardLocale[], push: (message: string) => void): unknown {
  if (field.type === "boolean") return raw === true;

  if (field.type === "number") {
    const { value, error } = coerceNumber(raw);
    if (error) push(error);
    return value;
  }

  if (field.type === "localized" || field.type === "localizedTextarea") {
    const localizedValue = coerceLocalized(raw);
    if (localizedValue.en) for (const problem of constitutionProblems(localizedValue.en, ["en"])) push(problem);
    if (localizedValue.fr) for (const problem of constitutionProblems(localizedValue.fr, ["fr"])) push(problem);
    return localizedValue;
  }

  const value = coerceString(raw);
  if (value === null) return null;
  const format = formatProblem(field, value);
  if (format) push(format);
  for (const problem of constitutionProblems(value, locales)) push(problem);
  return value;
}

function prepareObject(section: Extract<Section, { kind: "object" }>, fields: Record<string, unknown>): PrepareResult {
  const errors: FieldError[] = [];
  let content: Record<string, unknown> = {};
  for (const group of section.groups) {
    for (const field of group.fields) {
      const value = processField(field, fields[field.path], ["en", "fr"], (message) => errors.push({ path: field.path, message }));
      content = setPath(content, field.path, value);
    }
  }
  return { ok: errors.length === 0, errors, content };
}

function prepareList(section: Extract<Section, { kind: "list" }>, items: unknown[]): PrepareResult {
  const errors: FieldError[] = [];
  const content: unknown[] = [];

  items.forEach((raw, index) => {
    const entry = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const name = coerceString(entry.name);
    if (!name) return; // a nameless row is an empty row — dropped, not an error.

    const push = (path: string, message: string) => errors.push({ path, index, message });
    for (const problem of constitutionProblems(name, ["en", "fr"])) push("name", problem);

    const client: Record<string, unknown> = { name, approved: entry.approved === true };

    const url = coerceString(entry.url);
    if (url) {
      const problem = formatProblem({ path: "url", label: "Website", type: "url" }, url);
      if (problem) push("url", problem);
      client.url = url;
    }

    // Imaging (§1, Vito's lane): never set here, only passed through untouched.
    const logo = coerceString(entry.logo);
    if (logo) client.logo = logo;

    const quoteText = coerceLocalized(entry["quote.text"]);
    const quoteName = coerceString(entry["quote.name"]);
    const quoteRole = coerceLocalized(entry["quote.role"]);
    if (quoteText.en || quoteText.fr || quoteName || quoteRole.en || quoteRole.fr) {
      if (!quoteName) push("quote.name", "A quote needs a name to attribute it to.");
      if (quoteText.en) for (const p of constitutionProblems(quoteText.en, ["en"])) push("quote.text", p);
      if (quoteText.fr) for (const p of constitutionProblems(quoteText.fr, ["fr"])) push("quote.text", p);
      client.quote = {
        text: quoteText,
        name: quoteName ?? "",
        role: quoteRole.en || quoteRole.fr ? quoteRole : null,
      };
    }

    const caseStudy = coerceLocalized(entry.caseStudy);
    if (caseStudy.en || caseStudy.fr) {
      if (caseStudy.en) for (const p of constitutionProblems(caseStudy.en, ["en"])) push("caseStudy", p);
      if (caseStudy.fr) for (const p of constitutionProblems(caseStudy.fr, ["fr"])) push("caseStudy", p);
      client.caseStudy = caseStudy;
    }

    content.push(client);
  });

  return { ok: errors.length === 0, errors, content };
}

/** Validate and shape one section's submitted values into canonical content. */
export function prepareSection(section: Section, submitted: unknown): PrepareResult {
  const payload = submitted && typeof submitted === "object" ? (submitted as Record<string, unknown>) : {};
  if (section.kind === "object") {
    const fields = payload.fields && typeof payload.fields === "object" ? (payload.fields as Record<string, unknown>) : {};
    return prepareObject(section, fields);
  }
  const items = Array.isArray(payload.items) ? payload.items : [];
  return prepareList(section, items);
}
