// D15 length measure on the COPY itself: resolved message strings per page
// namespace (content data such as container names is not copy).
import { readFileSync } from "node:fs";

type Tree = Record<string, unknown>;
const load = (l: string) => JSON.parse(readFileSync(`i18n/messages/${l}.json`, "utf8")) as Tree;
const services = JSON.parse(readFileSync("content/services.json", "utf8"));

const strings = (v: unknown): string[] =>
  typeof v === "string"
    ? [v]
    : Array.isArray(v)
      ? v.flatMap(strings)
      : v && typeof v === "object"
        ? // a section's "slot" names a component, not copy
          Object.entries(v).flatMap(([k, x]) => (k === "slot" ? [] : strings(x)))
        : [];
const get = (tree: Tree, path: string) => path.split(".").reduce<unknown>((n, k) => (n as Tree | undefined)?.[k], tree);
const resolve = (s: string, l: "en" | "fr") =>
  s.replace(/\{ss\}/g, services.secondShift.name[l]).replace(/\{bn\}/g, services.bottleneck.name[l]).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

/** Namespaces each route renders as copy. */
export const COPY_NAMESPACES: Record<string, string[]> = {
  "/": ["meta.home", "home", "services"],
  "/visit": ["meta.visit", "visit"],
  "/quote": ["meta.quote", "quote", "form"],
  // The contact page embeds the form as shared furniture (data-shared), so
  // its copy is its own prose only; the form strings are the quote page's.
  // The details placard's row names (phone, email, address, hours) render
  // once contact.json has a value; they are copy, the values are content.
  "/contact": ["meta.contact", "pages.contact", "common.contact"],
};
/**
 * The common.specLabels keys each route's SpecGrid renders once
 * content/capabilities.json is filled (the title row plus one label per spec
 * the page asks for). They are copy the reader sees, so the ±10% gate counts
 * them; the values themselves are content data and are not counted.
 */
export const SPEC_LABEL_KEYS: Record<string, string[]> = {
  "/services/second-shift": ["crewSize", "shiftsOffered", "minimumCommitment", "insurance"],
  "/services/contract-packaging": [
    "minimumRunSize", "maximumRunSize", "fillSizesOffered", "viscosityRange", "leadTime",
    "fillers", "cappers", "tijLidPrinters", "scales",
  ],
  "/services/toll-blending": ["blendingBatchSizes", "viscosityRange", "leadTime"],
  "/containers/bottles-and-jugs": ["fillSizesOffered", "viscosityRange", "fillers", "cappers"],
  "/containers/pails": ["fillSizesOffered", "viscosityRange", "scales", "tijLidPrinters"],
  "/containers/kits": ["minimumRunSize", "leadTime"],
};

/** /containers/bottles-and-jugs → bottlesAndJugs (the message + page key). */
export function pageKeyFor(route: string): string {
  const last = route.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
}

export function namespacesFor(route: string, pageKey = pageKeyFor(route)): string[] {
  const own = COPY_NAMESPACES[route] ?? [`meta.${pageKey}`, `pages.${pageKey}`];
  const specs = SPEC_LABEL_KEYS[route];
  const specNamespaces = specs ? ["title", ...specs].map((key) => `common.specLabels.${key}`) : [];
  return [...own, ...specNamespaces];
}

export function copyLength(locale: "en" | "fr", namespaces: string[]): number {
  const tree = load(locale);
  return namespaces.flatMap((ns) => strings(get(tree, ns))).map((s) => resolve(s, locale)).join("").length;
}

export interface CopyRatioRow {
  route: string;
  en: number;
  fr: number;
  ratio: number;
}

/** D15 gate: message-level FR/EN character ratio, per route. */
export function copyRatios(routes: readonly string[]): CopyRatioRow[] {
  return routes.map((route) => {
    const ns = namespacesFor(route);
    const en = copyLength("en", ns);
    const fr = copyLength("fr", ns);
    return { route, en, fr, ratio: en > 0 ? fr / en : 0 };
  });
}
