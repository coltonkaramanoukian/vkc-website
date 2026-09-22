// D15 length measure on the COPY itself: resolved message strings per page
// namespace (content data such as container names is not copy).
import { readFileSync } from "node:fs";

type Tree = Record<string, unknown>;
const load = (l: string) => JSON.parse(readFileSync(`i18n/messages/${l}.json`, "utf8")) as Tree;
const services = JSON.parse(readFileSync("content/services.json", "utf8"));

const strings = (v: unknown): string[] =>
  typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];
const get = (tree: Tree, path: string) => path.split(".").reduce<unknown>((n, k) => (n as Tree | undefined)?.[k], tree);
const resolve = (s: string, l: "en" | "fr") =>
  s.replace(/\{ss\}/g, services.secondShift.name[l]).replace(/\{bn\}/g, services.bottleneck.name[l]).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

/** Namespaces each route renders as copy. */
export const COPY_NAMESPACES: Record<string, string[]> = {
  "/": ["meta.home", "home", "services"],
  "/visit": ["meta.visit", "visit"],
  "/quote": ["meta.quote", "quote", "form"],
};
export function namespacesFor(route: string, pageKey?: string): string[] {
  return COPY_NAMESPACES[route] ?? (pageKey ? [`meta.${pageKey}`, `pages.${pageKey}`] : []);
}

export function copyLength(locale: "en" | "fr", namespaces: string[]): number {
  const tree = load(locale);
  return namespaces.flatMap((ns) => strings(get(tree, ns))).map((s) => resolve(s, locale)).join("").length;
}
