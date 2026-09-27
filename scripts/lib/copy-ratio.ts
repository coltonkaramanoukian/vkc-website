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
  "/contact": ["meta.contact", "pages.contact"],
};
/** /containers/bottles-and-jugs → bottlesAndJugs (the message + page key). */
export function pageKeyFor(route: string): string {
  const last = route.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
}

export function namespacesFor(route: string, pageKey = pageKeyFor(route)): string[] {
  return COPY_NAMESPACES[route] ?? [`meta.${pageKey}`, `pages.${pageKey}`];
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
