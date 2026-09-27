// Every link and control on every page, CLICKED, in both locales at two
// widths, and where each click lands asserted rather than read off the href:
//   - a route link: the URL's pathname, the rendered route (main[data-route]),
//     no not-found copy, and the page at the top (scrollY 0) once settled;
//   - a same-page anchor: the hash, and the target sitting just under the
//     sticky header once the scroll settles;
//   - a summary: its <details> toggled (the site menu also closes on Escape);
//   - a submit button: the form answers "invalid" on an empty send and the
//     page stays put (nothing is sent: an empty form never reaches email);
//   - the chooser: every answer pair, its result link, and reset.
//   node scripts/click-through.ts [--base http://localhost:3200] [--widths 1280,375]
//     [--only /route] [--shared once|all] [--out .render/clicks.json]
// --shared once (default): header, menu, footer and action-bar links are
// clicked from two pages per locale (home and the Second Shift page), since
// they are the same elements on every page; every page's own links are
// always clicked. --shared all clicks everything from every page.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium, type Locator, type Page } from "@playwright/test";
import { PRESSURES, RESULT_ROUTE, WANTS, recommend } from "../src/lib/chooser.ts";
import { allUrls, localizedPath, locales, routes, type AppPathname, type Locale } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = flag("--base", "http://localhost:3200").replace(/\/$/, "");
const widths = flag("--widths", "1280,375").split(",").map(Number);
const only = args.includes("--only") ? flag("--only", "") : null;
const shared = flag("--shared", "once") as "once" | "all";
const out = flag("--out", ".render/clicks.json");

const CLICK_TIMEOUT = 4000;
const SETTLE_MS = 600;
const TOP_TOLERANCE_PX = 2;
/** How far under the header an anchor target may sit and still count as "landed". */
const ANCHOR_WINDOW_PX = 160;
const VIEWPORT_HEIGHT = 900;
const SHARED_FROM: readonly AppPathname[] = ["/", "/services/second-shift"];
const NOT_FOUND_COPY = ["This page does not exist.", "Cette page n’existe pas."];
const CANDIDATES = 'a[href], button, summary, input[type="submit"]';

type Region = "skip" | "header" | "menu" | "main" | "footer" | "action-bar" | "other";
const SHARED_REGIONS: readonly Region[] = ["skip", "header", "menu", "footer", "action-bar"];

interface Candidate {
  index: number;
  tag: string;
  type: string;
  href: string | null;
  text: string;
  region: Region;
  /** Index of the closest <details> ancestor among document's details, or -1. */
  detailsIndex: number;
  visible: boolean;
}

interface ClickResult {
  width: number;
  locale: Locale;
  from: string;
  region: Region;
  kind: string;
  text: string;
  href: string | null;
  expected: string;
  landed: string;
  scroll: number[];
  ok: boolean;
  skipped?: string;
  reason?: string;
  ms: number;
}

const routeByPath = new Map<string, AppPathname>();
for (const route of routes) for (const locale of locales) routeByPath.set(localizedPath(locale, route), route);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function open(page: Page, path: string): Promise<void> {
  await page.goto(base + path, { waitUntil: "load" });
  // Hydrated, so a next/link click is a client-side transition (the case
  // under test), not a full document load that would land at the top anyway.
  await page.waitForFunction(
    () => {
      const main = document.querySelector("main");
      return !!main && Object.keys(main).some((key) => key.startsWith("__reactFiber$"));
    },
    undefined,
    { timeout: 10_000 },
  );
}

async function collect(page: Page): Promise<Candidate[]> {
  return page.evaluate((selector) => {
    const details = Array.from(document.querySelectorAll("details"));
    const wasOpen = details.map((d) => d.open);
    // Measure with every disclosure open, so links inside the menu and the
    // FAQ count as reachable; the click step opens the one it needs.
    details.forEach((d) => (d.open = true));
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const list = nodes.map((el, index) => {
      const region: Region = el.classList.contains("skip-link")
        ? "skip"
        : el.closest(".menu-panel")
          ? "menu"
          : el.closest("header.site-header")
            ? "header"
            : el.closest("main")
              ? "main"
              : el.closest("footer")
                ? "footer"
                : el.closest(".action-bar")
                  ? "action-bar"
                  : "other";
      const style = getComputedStyle(el);
      const rects = el.getClientRects();
      const visible = rects.length > 0 && style.visibility !== "hidden" && style.display !== "none";
      const parentDetails = el.closest("details");
      return {
        index,
        tag: el.tagName.toLowerCase(),
        type: (el as HTMLInputElement).type ?? "",
        href: el.getAttribute("href"),
        text: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60),
        region,
        detailsIndex: parentDetails ? details.indexOf(parentDetails) : -1,
        visible,
      };
    });
    details.forEach((d, i) => (d.open = wasOpen[i]));
    return list;
  }, CANDIDATES);
}

async function scrollY(page: Page): Promise<number> {
  return page.evaluate(() => Math.round(window.scrollY));
}

/** Poll until two consecutive reads agree (a smooth scroll has finished). */
async function settled(page: Page, limitMs = 2500): Promise<number> {
  let last = await scrollY(page);
  const started = Date.now();
  while (Date.now() - started < limitMs) {
    await wait(120);
    const next = await scrollY(page);
    if (next === last) return next;
    last = next;
  }
  return last;
}

async function revealDetails(page: Page, candidate: Candidate): Promise<void> {
  if (candidate.detailsIndex < 0) return;
  const details = page.locator("details").nth(candidate.detailsIndex);
  if (await details.evaluate((d) => (d as HTMLDetailsElement).open)) return;
  await details.locator("summary").first().click({ timeout: CLICK_TIMEOUT });
  await details.locator("summary").first().waitFor({ state: "visible", timeout: CLICK_TIMEOUT });
}

function locate(page: Page, candidate: Candidate): Locator {
  return page.locator(CANDIDATES).nth(candidate.index);
}

async function clickSkipLink(page: Page, target: Locator): Promise<Partial<ClickResult>> {
  await target.focus();
  const shown = await target.evaluate((el) => el.getBoundingClientRect().top >= 0);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#main", undefined, { timeout: CLICK_TIMEOUT });
  return { kind: "skip-link", expected: "#main", landed: "#main", ok: shown, reason: shown ? undefined : "skip link never became visible on focus" };
}

async function clickSummary(page: Page, target: Locator): Promise<Partial<ClickResult>> {
  const details = target.locator("xpath=ancestor::details[1]");
  const before = await details.evaluate((d) => (d as HTMLDetailsElement).open);
  await target.click({ timeout: CLICK_TIMEOUT });
  const after = await details.evaluate((d) => (d as HTMLDetailsElement).open);
  const isMenu = await details.evaluate((d) => d.classList.contains("menu"));
  let ok = before !== after;
  let reason = ok ? undefined : "details did not toggle";
  if (ok && isMenu && after) {
    const panelShown = await page.locator(".menu-panel").isVisible();
    await page.keyboard.press("Escape");
    const closedOnEscape = !(await details.evaluate((d) => (d as HTMLDetailsElement).open));
    ok = panelShown && closedOnEscape;
    reason = panelShown ? (closedOnEscape ? undefined : "menu did not close on Escape") : "menu panel not visible when open";
  }
  return { kind: isMenu ? "menu-toggle" : "disclosure", expected: `open=${!before}`, landed: `open=${after}`, ok, reason };
}

async function clickSubmit(page: Page, target: Locator, from: string): Promise<Partial<ClickResult>> {
  const form = target.locator("xpath=ancestor::form[1]");
  await target.click({ timeout: CLICK_TIMEOUT });
  let status = "";
  try {
    await form.evaluate(
      (f) =>
        new Promise<void>((resolve) => {
          const done = () => {
            const s = f.getAttribute("data-form-status");
            if (s && s !== "idle" && s !== "sending") resolve();
          };
          const observer = new MutationObserver(done);
          observer.observe(f, { attributes: true, attributeFilter: ["data-form-status"] });
          done();
        }),
      undefined,
      { timeout: 8000 },
    );
    status = (await form.getAttribute("data-form-status")) ?? "";
  } catch {
    status = (await form.getAttribute("data-form-status")) ?? "timeout";
  }
  const stayed = new URL(page.url()).pathname === from;
  // "invalid" is the answer to an empty form. "rate_limited" is the API's
  // per-IP limit tripping after this run's own earlier submits; the click was
  // still handled in place, which is what this gate checks (NC-5 covers the
  // form's own validation).
  const handled = status === "invalid" || status === "rate_limited";
  const ok = handled && stayed;
  return {
    kind: "submit",
    expected: "invalid (empty form), same page",
    landed: `${status}, ${stayed ? "same page" : new URL(page.url()).pathname}`,
    ok,
    reason: ok ? undefined : `empty submit answered "${status}"${stayed ? "" : " and left the page"}`,
  };
}

async function clickAnchor(page: Page, target: Locator, href: string, from: string): Promise<Partial<ClickResult>> {
  const url = new URL(href, base + from);
  if (url.protocol === "tel:" || url.protocol === "mailto:") {
    const ok = url.protocol === "tel:" ? /^tel:\+?[\d().\s-]{7,}$/.test(href) : /^mailto:[^@\s]+@[^@\s]+$/.test(href);
    return { kind: url.protocol.slice(0, -1), expected: href, landed: href, ok, skipped: "not clicked (leaves the browser)", reason: ok ? undefined : "malformed" };
  }
  if (url.origin !== new URL(base).origin) {
    return { kind: "external", expected: href, landed: href, ok: false, reason: "external link (none expected on this site)" };
  }
  const expectedPath = url.pathname;
  const hash = url.hash;
  const samePage = expectedPath === from && hash !== "";

  if (samePage) {
    await target.click({ timeout: CLICK_TIMEOUT });
    await page.waitForFunction((h) => location.hash === h, hash, { timeout: CLICK_TIMEOUT });
    const finalY = await settled(page);
    const pos = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
      const doc = document.documentElement;
      return {
        top: Math.round(el.getBoundingClientRect().top),
        header: Math.round(header),
        atEnd: doc.scrollHeight - (window.scrollY + window.innerHeight) <= 1,
      };
    }, hash.slice(1));
    if (!pos) return { kind: "anchor", expected: hash, landed: "(no such id)", scroll: [finalY], ok: false, reason: `no element with id ${hash.slice(1)}` };
    const underHeader = pos.top < pos.header - 1;
    const tooLow = pos.top > pos.header + ANCHOR_WINDOW_PX && !pos.atEnd;
    const ok = !underHeader && !tooLow;
    return {
      kind: "anchor",
      expected: `${hash} just under the header`,
      landed: `${hash} at ${pos.top}px (header ${pos.header}px)`,
      scroll: [finalY],
      ok,
      reason: ok ? undefined : underHeader ? "target hidden under the sticky header" : "target not brought into view",
    };
  }

  const expectedRoute = routeByPath.get(expectedPath);
  if (!expectedRoute) {
    return { kind: "route", expected: expectedPath, landed: "(not clicked)", ok: false, reason: "href is not a route in src/i18n/pathnames.ts" };
  }
  const startY = await target.evaluate(() => Math.round(window.scrollY));
  await target.click({ timeout: CLICK_TIMEOUT });
  await page.waitForURL((u) => u.pathname === expectedPath, { timeout: 8000 });
  await page.waitForFunction(
    (route) => document.querySelector("main")?.getAttribute("data-route") === route,
    expectedRoute,
    { timeout: 8000 },
  );
  const scroll = [await scrollY(page)];
  await wait(100);
  scroll.push(await scrollY(page));
  await wait(SETTLE_MS - 100);
  scroll.push(await scrollY(page));
  const landedUrl = new URL(page.url());
  const landed = landedUrl.pathname + landedUrl.hash;
  const notFound = await page.evaluate((copy) => copy.some((line) => document.body.innerText.includes(line)), NOT_FOUND_COPY);
  const finalY = scroll[scroll.length - 1];
  const reasons: string[] = [];
  if (landed !== expectedPath + hash) reasons.push(`landed on ${landed}`);
  if (notFound) reasons.push("not-found page rendered");
  if (hash === "" && finalY > TOP_TOLERANCE_PX) reasons.push(`page opened at scrollY ${finalY} (started at ${startY}), not at the top`);
  return { kind: "route", expected: expectedPath + hash, landed, scroll, ok: reasons.length === 0, reason: reasons.join("; ") || undefined };
}

async function clickCandidate(page: Page, candidate: Candidate, from: string): Promise<Partial<ClickResult>> {
  await revealDetails(page, candidate);
  const target = locate(page, candidate);
  if (candidate.region === "skip") return clickSkipLink(page, target);
  if (candidate.tag === "summary") return clickSummary(page, target);
  if (candidate.tag === "a" && candidate.href !== null) return clickAnchor(page, target, candidate.href, from);
  if (candidate.type === "submit") return clickSubmit(page, target, from);
  // Any other button: it must act in place, never leave the page.
  await target.click({ timeout: CLICK_TIMEOUT });
  await wait(150);
  const stayed = new URL(page.url()).pathname === from;
  return { kind: "button", expected: "same page", landed: stayed ? "same page" : new URL(page.url()).pathname, ok: stayed, reason: stayed ? undefined : "button navigated away" };
}

async function chooserRuns(page: Page, width: number, locale: Locale, route: AppPathname, from: string): Promise<ClickResult[]> {
  const results: ClickResult[] = [];
  await open(page, from);
  if ((await page.locator("[data-chooser]").count()) === 0) return results;
  for (const pressure of PRESSURES) {
    for (const want of WANTS) {
      const started = Date.now();
      await open(page, from);
      await page.locator(`input[name="pressure"][value="${pressure}"]`).check({ timeout: CLICK_TIMEOUT });
      await page.locator(`input[name="want"][value="${want}"]`).check({ timeout: CLICK_TIMEOUT });
      const expectedResult = recommend(pressure, want);
      const result = page.locator("[data-chooser-result]");
      let reason: string | undefined;
      let landed = "";
      try {
        await result.waitFor({ state: "visible", timeout: CLICK_TIMEOUT });
        const shown = await result.getAttribute("data-chooser-result");
        if (shown !== expectedResult) reason = `chooser showed ${shown}, expected ${expectedResult}`;
        const link = result.locator("a").first();
        const href = await link.getAttribute("href");
        const expectedPath = expectedResult ? localizedPath(locale, RESULT_ROUTE[expectedResult]) : "";
        const outcome = await clickAnchor(page, link, href ?? "", from);
        landed = outcome.landed ?? "";
        if (!outcome.ok) reason = [reason, outcome.reason].filter(Boolean).join("; ");
        else if (landed !== expectedPath) reason = `result link went to ${landed}, expected ${expectedPath}`;
      } catch (error) {
        reason = `chooser result never appeared: ${String(error).split("\n")[0]}`;
      }
      results.push({
        width,
        locale,
        from,
        region: "main",
        kind: "chooser",
        text: `${pressure} + ${want}`,
        href: null,
        expected: expectedResult ? localizedPath(locale, RESULT_ROUTE[expectedResult]) : "",
        landed,
        scroll: [],
        ok: !reason,
        reason,
        ms: Date.now() - started,
      });
    }
  }
  // Reset: the answer disappears and both questions are blank again.
  const started = Date.now();
  await open(page, from);
  await page.locator('input[name="pressure"][value="shifts"]').check({ timeout: CLICK_TIMEOUT });
  await page.locator('input[name="want"][value="ownLine"]').check({ timeout: CLICK_TIMEOUT });
  await page.locator("[data-chooser-result] button").click({ timeout: CLICK_TIMEOUT });
  const cleared =
    (await page.locator("[data-chooser-result]").count()) === 0 &&
    (await page.locator("[data-chooser] input:checked").count()) === 0;
  results.push({
    width,
    locale,
    from,
    region: "main",
    kind: "chooser",
    text: "reset",
    href: null,
    expected: "no result, nothing checked",
    landed: cleared ? "cleared" : "still showing",
    scroll: [],
    ok: cleared,
    reason: cleared ? undefined : "reset left the chooser answered",
    ms: Date.now() - started,
  });
  void route;
  return results;
}

async function runWidth(width: number): Promise<ClickResult[]> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height: VIEWPORT_HEIGHT } });
  const page = await context.newPage();
  const results: ClickResult[] = [];
  const urls = allUrls().filter((u) => (only ? u.route === only : true));

  for (const { locale, route, path } of urls) {
    await open(page, path);
    const candidates = await collect(page);
    const includeShared = shared === "all" || SHARED_FROM.includes(route);
    const chosen = candidates.filter((c) => includeShared || !SHARED_REGIONS.includes(c.region));
    let pass = 0;
    let fail = 0;
    let hidden = 0;

    for (const candidate of chosen) {
      const started = Date.now();
      const record: ClickResult = {
        width,
        locale,
        from: path,
        region: candidate.region,
        kind: candidate.tag,
        text: candidate.text,
        href: candidate.href,
        expected: "",
        landed: "",
        scroll: [],
        ok: false,
        ms: 0,
      };
      if (!candidate.visible) {
        hidden += 1;
        results.push({ ...record, ok: true, skipped: `hidden at ${width}px`, ms: 0 });
        continue;
      }
      try {
        await open(page, path);
        const outcome = await clickCandidate(page, candidate, path);
        Object.assign(record, outcome);
      } catch (error) {
        record.ok = false;
        record.reason = String(error).split("\n")[0].slice(0, 200);
        record.landed = new URL(page.url()).pathname;
      }
      record.ms = Date.now() - started;
      results.push(record);
      if (record.ok) pass += 1;
      else {
        fail += 1;
        console.log(`    ✖ [${record.region}] "${record.text}" → ${record.href ?? record.kind}: ${record.reason}`);
      }
    }

    const chooser = await chooserRuns(page, width, locale, route, path);
    results.push(...chooser);
    const chooserFail = chooser.filter((r) => !r.ok).length;
    pass += chooser.length - chooserFail;
    fail += chooserFail;

    const mark = fail === 0 ? "✔" : "✖";
    console.log(
      `  ${mark} ${String(width).padStart(4)}  ${path.padEnd(44)} ${String(pass).padStart(3)} ok  ${String(fail).padStart(2)} failed  ${String(hidden).padStart(2)} hidden${includeShared ? "  (+shared)" : ""}`,
    );
  }

  await browser.close();
  return results;
}

console.log(`Click-through against ${base} at ${widths.join(", ")}px, shared links ${shared === "all" ? "from every page" : "from home and Second Shift"}`);
const all: ClickResult[] = [];
for (const width of widths) all.push(...(await runWidth(width)));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(all, null, 2));

const clicked = all.filter((r) => !r.skipped);
const failures = all.filter((r) => !r.ok);
console.log(`\n${clicked.length} clicks, ${all.length - clicked.length} skipped (hidden at that width, or tel:/mailto:), written to ${out}`);
for (const width of widths) {
  for (const locale of locales) {
    const slice = clicked.filter((r) => r.width === width && r.locale === locale);
    const bad = slice.filter((r) => !r.ok).length;
    console.log(`  ${width}px ${locale}: ${slice.length - bad}/${slice.length} landed where they should`);
  }
}
if (failures.length > 0) {
  console.log(`\nRED — ${failures.length} click(s) landed in the wrong place`);
  for (const f of failures) {
    console.log(`  ✖ ${f.width}px ${f.from} [${f.region}] "${f.text}" → ${f.href ?? f.kind}: ${f.reason}`);
  }
  process.exit(1);
}
console.log("GREEN — every click landed where it should");
