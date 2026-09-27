// D12 accessibility, measured rather than assumed: axe-core over every URL
// in both locales at a phone width and a desktop width. Any violation not
// listed in guard/a11y-allowlist.json is red.
//   node scripts/a11y.ts [--base http://localhost:3100] [--header "k: v"] [--self-check]
// --self-check injects an unlabelled button into the first page and proves the
// scan turns red, then continues. A gate nobody saw fail is a hope (§7).
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "@playwright/test";
import { allUrls } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = flag("--base", "http://localhost:3100").replace(/\/$/, "");
const headerArg = args.includes("--header") ? flag("--header", "") : "";
const extraHTTPHeaders: Record<string, string> = headerArg
  ? { [headerArg.split(":")[0].trim()]: headerArg.slice(headerArg.indexOf(":") + 1).trim() }
  : {};
const selfCheck = args.includes("--self-check");

const allow = JSON.parse(readFileSync("guard/a11y-allowlist.json", "utf8")) as { rules: { id: string; why: string }[] };
const allowed = new Set(allow.rules.map((r) => r.id));
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const WIDTHS = [375, 1280] as const;

interface Hit {
  path: string;
  width: number;
  id: string;
  impact: string;
  nodes: number;
  help: string;
  target: string;
}

async function scan(page: Page): Promise<{ hits: Hit[]; passes: number }> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const url = new URL(page.url());
  const width = page.viewportSize()?.width ?? 0;
  const hits = results.violations
    .filter((v) => !allowed.has(v.id))
    .map((v) => ({
      path: url.pathname,
      width,
      id: v.id,
      impact: v.impact ?? "unknown",
      nodes: v.nodes.length,
      help: v.help,
      target: String(v.nodes[0]?.target?.[0] ?? ""),
    }));
  return { hits, passes: results.passes.length };
}

const browser = await chromium.launch();
const urls = allUrls();
const failures: Hit[] = [];
let scanned = 0;
let passes = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 }, extraHTTPHeaders });
  const page = await context.newPage();
  for (const [index, url] of urls.entries()) {
    const response = await page.goto(base + url.path, { waitUntil: "networkidle" });
    if (!response || response.status() !== 200) {
      failures.push({ path: url.path, width, id: "http", impact: "critical", nodes: 0, help: `HTTP ${response?.status() ?? 0}`, target: "" });
      continue;
    }
    if (selfCheck && width === WIDTHS[0] && index === 0) {
      await page.evaluate(() => {
        const b = document.createElement("button");
        b.id = "a11y-self-check";
        document.querySelector("main")?.append(b);
      });
      const { hits } = await scan(page);
      const caught = hits.some((h) => h.id === "button-name");
      console.log(`self-check: injected an unlabelled <button> on ${url.path} → ${caught ? "RED as expected (button-name)" : "NOT CAUGHT"}`);
      if (!caught) failures.push({ path: url.path, width, id: "self-check", impact: "critical", nodes: 1, help: "axe did not flag the injected defect", target: "#a11y-self-check" });
      await page.evaluate(() => document.getElementById("a11y-self-check")?.remove());
    }
    const result = await scan(page);
    scanned += 1;
    passes += result.passes;
    failures.push(...result.hits);
    const mark = result.hits.length === 0 ? "✔" : "✖";
    console.log(`${mark} ${String(width).padStart(4)}px  ${url.path.padEnd(42)} ${result.hits.length === 0 ? `${result.passes} rules pass` : `${result.hits.length} violation(s)`}`);
  }
  await context.close();
}
await browser.close();

console.log(`\naxe: ${scanned} scans (${urls.length} URLs × ${WIDTHS.length} widths), tags ${TAGS.join(", ")}, ${passes} rule passes, ${allowed.size} allowlisted rule(s)`);
if (failures.length > 0) {
  console.log(`RED — ${failures.length} violation(s):`);
  for (const f of failures) console.log(`  ✖ ${f.width}px ${f.path} [${f.id}, ${f.impact}, ${f.nodes} node(s)] ${f.help} — ${f.target}`);
  process.exit(1);
}
console.log("GREEN — no axe violation on any page at either width");
