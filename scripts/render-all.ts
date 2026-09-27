// Renders every route in both locales (JS disabled: the HTML as shipped) and
// writes one JSON capture per page to .render/. Guards read these captures.
//   node scripts/render-all.ts [--base http://localhost:3100] [--out .render]
//   [--header "name: value"]   (e.g. a Vercel protection-bypass header)
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { allUrls, expectedPageCount, slug } from "./lib/routes.ts";

export interface PageCapture {
  locale: "fr" | "en";
  route: string;
  path: string;
  status: number;
  title: string;
  meta: {
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImageAlt: string;
    twitterTitle: string;
    twitterDescription: string;
    twitterImageAlt: string;
    robots: string;
  };
  canonical: string | null;
  alternates: { hreflang: string; href: string }[];
  jsonLd: string[];
  bodyText: string;
  mainText: string;
  /** main text minus shared blocks (CTA band) — for the cut-rule word count */
  ownText: string;
  attrText: string;
  guardSurfaces: string[];
  localeSwitch: string | null;
  imgSrcs: string[];
  videoSrcs: string[];
  videoPreloads: string[];
  placeholderCount: number;
  emptyPhotoWrappers: number;
}

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = flag("--base", "http://localhost:3100").replace(/\/$/, "");
const out = flag("--out", ".render");
const headerArg = args.includes("--header") ? flag("--header", "") : "";
const extraHeaders: Record<string, string> = headerArg
  ? { [headerArg.split(":")[0].trim()]: headerArg.slice(headerArg.indexOf(":") + 1).trim() }
  : {};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false, extraHTTPHeaders: extraHeaders });
const page = await context.newPage();
// --only <route-prefix>: draft-time partial renders (skips the completeness check).
const only = args.includes("--only") ? flag("--only", "") : "";
const urls = allUrls().filter((u) => !only || u.route.startsWith(only));
let written = 0;

for (const url of urls) {
  const response = await page.goto(base + url.path, { waitUntil: "load" });
  const status = response?.status() ?? 0;
  const capture = await page.evaluate(() => {
    // Element boundaries become spaces: textContent alone glues a label to the
    // value beside it ("Directed by" + "Our lead hand...") and a word-boundary
    // guard can then miss a term that is plainly on the page.
    const serialize = (node: Node): string =>
      node.nodeType === Node.TEXT_NODE
        ? (node.textContent ?? "")
        : Array.from(node.childNodes).map(serialize).join(" ");
    const clean = (root: Element | null, drop: string[] = []) => {
      if (!root) return "";
      const clone = root.cloneNode(true) as Element;
      clone.querySelectorAll(["script", "style", "template", ...drop].join(",")).forEach((n) => n.remove());
      return serialize(clone).replace(/\s+/g, " ").trim();
    };
    const meta = (sel: string) => document.querySelector<HTMLMetaElement>(sel)?.content ?? "";
    const attrs = Array.from(document.body.querySelectorAll("[alt],[title],[aria-label],[placeholder]"))
      .flatMap((el) => ["alt", "title", "aria-label", "placeholder"].map((a) => el.getAttribute(a) ?? ""))
      .filter(Boolean);
    const main = document.querySelector("main");
    return {
      title: document.title,
      meta: {
        description: meta('meta[name="description"]'),
        ogTitle: meta('meta[property="og:title"]'),
        ogDescription: meta('meta[property="og:description"]'),
        ogImageAlt: meta('meta[property="og:image:alt"]'),
        twitterTitle: meta('meta[name="twitter:title"]'),
        twitterDescription: meta('meta[name="twitter:description"]'),
        twitterImageAlt: meta('meta[name="twitter:image:alt"]'),
        robots: meta('meta[name="robots"]'),
      },
      canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null,
      alternates: Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map(
        (l) => ({ hreflang: l.hreflang, href: l.href }),
      ),
      jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (s) => s.textContent ?? "",
      ),
      bodyText: clean(document.body),
      mainText: clean(main),
      ownText: clean(main, ["[data-shared]"]),
      attrText: attrs.join(" | "),
      guardSurfaces: Array.from(document.querySelectorAll('[data-guard="second-shift"]')).map((el) => clean(el)),
      localeSwitch: document.querySelector<HTMLAnchorElement>("a[data-locale-switch]")?.getAttribute("href") ?? null,
      imgSrcs: Array.from(document.querySelectorAll("img")).map((i) => i.getAttribute("src") ?? ""),
      videoSrcs: Array.from(document.querySelectorAll("video, video source")).map((v) => v.getAttribute("src") ?? ""),
      videoPreloads: Array.from(document.querySelectorAll("video")).map((v) => v.getAttribute("preload") ?? ""),
      placeholderCount: document.querySelectorAll(".vkc-photo-placeholder").length,
      emptyPhotoWrappers: Array.from(document.querySelectorAll("figure")).filter((f) => !f.querySelector("img, video")).length,
    };
  });
  const record: PageCapture = { locale: url.locale, route: url.route, path: url.path, status, ...capture };
  writeFileSync(`${out}/${slug(url.path)}.json`, JSON.stringify(record, null, 2));
  written += 1;
}

await browser.close();
const expected = only ? urls.length : expectedPageCount();
console.log(`rendered ${written}/${expected} pages from ${base} → ${out}/${only ? ` (only ${only})` : ""}`);
if (written !== expected) {
  console.error("render set is incomplete");
  process.exit(1);
}
