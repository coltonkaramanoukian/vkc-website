// Deep links into the glossary. Copy writes `[QC sheets](/glossary#qc-sheet)`
// with a language-neutral key; the key resolves to that locale's own entry,
// whose anchor is the slug of its term ("Feuille CQ" → #feuille-cq). The
// map is the one place the two term lists are tied together, and a test
// checks every mapped term exists in both message files.
import { slugify } from "./slug.ts";
import { localizedPath, type Locale } from "../i18n/pathnames.ts";

export const GLOSSARY_TERMS = {
  bottleneck: { en: "Bottleneck", fr: "Goulot" },
  changeover: { en: "Changeover", fr: "Changement de format" },
  closure: { en: "Closure", fr: "Fermeture" },
  "contract-packaging": { en: "Contract packaging", fr: "Conditionnement à forfait" },
  "d-jug": { en: "D-jug", fr: "Bidon D-jug" },
  "fill-line": { en: "Fill line", fr: "Ligne de remplissage" },
  "fill-to-line": { en: "Fill-to-line", fr: "Remplissage au niveau" },
  hdpe: { en: "HDPE", fr: "PEHD" },
  kitting: { en: "Kitting", fr: "Assemblage de trousses" },
  "lead-hand": { en: "Lead hand", fr: "Chef d’équipe" },
  lot: { en: "Lot", fr: "Lot" },
  pail: { en: "Pail", fr: "Seau" },
  "production-log": { en: "Production log", fr: "Registre de production" },
  "qc-sheet": { en: "QC sheet", fr: "Feuille CQ" },
  ropak: { en: "Ropak", fr: "Ropak" },
  "safety-data-sheet": { en: "Safety data sheet", fr: "Fiche de données de sécurité" },
  "second-shift": { en: "Second Shift", fr: "Deuxième quart" },
  shift: { en: "Shift", fr: "Quart" },
  specification: { en: "Specification", fr: "Spécification" },
  "toll-blending": { en: "Toll blending", fr: "Mélange à façon" },
  viscosity: { en: "Viscosity", fr: "Viscosité" },
  "weigh-fill": { en: "Weigh-fill", fr: "Remplissage pondéral" },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY_TERMS;

export function isGlossaryKey(value: string): value is GlossaryKey {
  return Object.prototype.hasOwnProperty.call(GLOSSARY_TERMS, value);
}

/** The term as the glossary page prints it in that language. */
export function glossaryTerm(locale: Locale, key: GlossaryKey): string {
  return GLOSSARY_TERMS[key][locale];
}

/** Fragment of the entry on that locale's glossary page: "qc-sheet" → "feuille-cq" in French. */
export function glossaryAnchor(locale: Locale, key: GlossaryKey): string {
  return slugify(glossaryTerm(locale, key));
}

/** Full localized href, e.g. "/fr/lexique#feuille-cq". */
export function glossaryHref(locale: Locale, key: GlossaryKey): string {
  return `${localizedPath(locale, "/glossary")}#${glossaryAnchor(locale, key)}`;
}
