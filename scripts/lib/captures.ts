// Loads .render/ captures and refuses to guard an empty or short scan set.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { PageCapture } from "../render-all.ts";
import { expectedPageCount } from "./routes.ts";

export function loadCaptures(dir = ".render"): PageCapture[] {
  if (!existsSync(dir)) {
    throw new Error(`${dir}/ does not exist — run scripts/render-all.ts first`);
  }
  const captures = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as PageCapture);
  const expected = expectedPageCount();
  // A guard that scans nothing passes forever.
  if (captures.length === 0 || captures.length < expected) {
    throw new Error(`scan set has ${captures.length} pages; expected at least ${expected}`);
  }
  const bad = captures.filter((c) => c.status !== 200);
  if (bad.length > 0) {
    throw new Error(`captures with non-200 status: ${bad.map((c) => `${c.status} ${c.path}`).join(", ")}`);
  }
  return captures;
}

/** Every string a visitor or crawler can read on the page. */
export function readableText(c: PageCapture): string {
  const ld = c.jsonLd.join(" ");
  // Defaults: a capture written before these tags were recorded still loads.
  const { description, ogTitle, ogDescription, ogImageAlt = "", twitterTitle = "", twitterDescription = "", twitterImageAlt = "" } = c.meta;
  return [c.title, description, ogTitle, ogDescription, ogImageAlt, twitterTitle, twitterDescription, twitterImageAlt, ld, c.bodyText, c.attrText].join(" \n ");
}

export type { PageCapture };
