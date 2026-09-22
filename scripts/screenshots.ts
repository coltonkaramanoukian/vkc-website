// Phase 4 evidence: one screenshot per URL, at the widths a prospect uses.
//   node scripts/screenshots.ts --base <url> --out artifacts/shots
//     [--mode production|preview] [--header "k: v"] [--wide /,/services/second-shift]
// production mode = placeholders off, every photo null: what a prospect sees
// today. preview mode = NEXT_PUBLIC_SHOW_PLACEHOLDERS=1, the photo slots drawn.
import { mkdirSync, rmSync } from "node:fs";
import { chromium } from "@playwright/test";
import { allUrls, slug } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = flag("--base", "http://localhost:3111").replace(/\/$/, "");
const out = flag("--out", "artifacts/shots");
const mode = flag("--mode", "production");
const only = flag("--only", "");
const wide = flag("--wide", "").split(",").filter(Boolean);
const headerArg = args.includes("--header") ? flag("--header", "") : "";
const extraHTTPHeaders: Record<string, string> = headerArg
  ? { [headerArg.split(":")[0].trim()]: headerArg.slice(headerArg.indexOf(":") + 1).trim() }
  : {};

if (args.includes("--clean")) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const urls = allUrls().filter((u) => !only || u.route === only);
let shot = 0;

for (const width of [390, ...(wide.length > 0 ? [1280] : [])]) {
  const targets = width === 390 ? urls : urls.filter((u) => wide.includes(u.route));
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 800 },
    deviceScaleFactor: 1,
    extraHTTPHeaders,
  });
  const page = await context.newPage();
  for (const url of targets) {
    const response = await page.goto(base + url.path, { waitUntil: "networkidle" });
    const file = `${out}/${mode}-${width}-${slug(url.path)}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${response?.status() ?? 0} ${String(width).padStart(4)}px  ${url.path.padEnd(40)} ${file}`);
    shot += 1;
  }
  await context.close();
}

await browser.close();
console.log(`${shot} screenshots in ${mode} mode → ${out}/`);
