import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FooterCallback } from "../components/footer-callback.ts";
import { callbackLine } from "./callback.ts";

function render(phone: string | null | undefined, slogan: string | null | undefined): string {
  return renderToStaticMarkup(createElement(FooterCallback, { phone, slogan }));
}

function sloganText(html: string): string | null {
  const m = html.match(/<([a-z0-9]+)[^>]*data-testid="footer-slogan"[^>]*>([\s\S]*?)<\/\1>/);
  return m ? m[2].replace(/<[^>]+>/g, "") : null;
}

function phoneAnchors(html: string): { href: string; text: string }[] {
  return [...html.matchAll(/<a\b([^>]*data-testid="footer-callback-phone"[^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: m[1].match(/href="([^"]*)"/)?.[1] ?? "",
    text: m[2].replace(/<[^>]+>/g, ""),
  }));
}

function stringLeaves(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") {
    if (v !== "") out.push(v);
  } else if (Array.isArray(v)) {
    v.forEach((x) => stringLeaves(x, out));
  } else if (v && typeof v === "object") {
    Object.values(v).forEach((x) => stringLeaves(x, out));
  }
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

test("renders the slogan and a tel: link from phone and slogan", () => {
  const html = render(" +1 (514) 555-0100 ", " The plant next door. ");
  assert.equal(sloganText(html), "The plant next door.");
  const anchors = phoneAnchors(html);
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].href, "tel:+15145550100");
  assert.equal(anchors[0].text, "+1 (514) 555-0100");
});

test("no leading plus means no plus in the href", () => {
  const anchors = phoneAnchors(render("514-555-0100", "x"));
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].href, "tel:5145550100");
});

test("missing, blank or digitless phone drops the link but keeps the slogan", () => {
  for (const phone of [null, undefined, "   ", "call us"]) {
    const html = render(phone, "The plant next door.");
    assert.equal(phoneAnchors(html).length, 0);
    assert.equal(sloganText(html), "The plant next door.");
  }
});

test("null or blank slogan drops the slogan but keeps the link", () => {
  for (const slogan of [null, undefined, "   "]) {
    const html = render("514-555-0100", slogan);
    assert.equal(sloganText(html), null);
    assert.equal(phoneAnchors(html).length, 1);
  }
});

test("renders nothing when there is neither phone nor slogan", () => {
  assert.equal(render(null, null), "");
  assert.equal(render("", "  "), "");
});

test("rendered output is derived from the callbackLine result", () => {
  const cases: [string | null | undefined, string | null | undefined][] = [
    [" +1 (514) 555-0100 ", " The plant next door. "],
    ["514-555-0100", null],
    [null, "The plant next door."],
    ["call us", "  "],
    [null, null],
  ];
  for (const [phone, slogan] of cases) {
    const html = render(phone, slogan);
    const leaves = stringLeaves(callbackLine(phone, slogan));
    for (const leaf of leaves) {
      assert.ok(html.includes(escapeHtml(leaf)), `missing ${JSON.stringify(leaf)} in ${html}`);
    }
    if (leaves.length === 0) assert.equal(html, "");
  }
});

test("footer-callback.ts uses createElement, no JSX, relative imports only, and calls callbackLine(phone, slogan)", () => {
  const src = readFileSync(new URL("../components/footer-callback.ts", import.meta.url), "utf8");
  assert.match(src, /import\s*\{[^}]*\bcreateElement\b[^}]*\}\s*from\s*["']react["']/);
  assert.match(src, /createElement\(/);
  assert.ok(!/<\/[A-Za-z]|\/>/.test(src), "source must not contain JSX");
  const specs = [...src.matchAll(/(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']/g)].map((m) => m[1]);
  assert.ok(specs.length >= 2);
  for (const s of specs) {
    assert.ok(s === "react" || s.startsWith("./") || s.startsWith("../"), `non-relative import ${s}`);
  }
  assert.ok(!src.includes("@/"));
  assert.match(src, /import\s*\{[^}]*\bcallbackLine\b[^}]*\}\s*from\s*["']\.\.\/lib\/callback\.ts["']/);
  assert.match(src, /callbackLine\(\s*phone\s*,\s*slogan\s*\)/);
});

test("site footer renders FooterCallback with contact.phone and the plantNextDoor tagline", () => {
  const src = readFileSync(new URL("../components/site-footer.tsx", import.meta.url), "utf8").replace(/"/g, "'");
  assert.match(src, /import\s*\{\s*FooterCallback\s*\}\s*from\s*'[^']*footer-callback(\.ts)?'/);
  const usage = /<FooterCallback\s+phone=\{contact\.phone\}\s+slogan=\{taglineOption\('plantNextDoor',\s*locale\)\}\s*\/>/g;
  assert.equal((src.match(usage) ?? []).length, 1);
  assert.equal((src.match(/contact\.phone/g) ?? []).length, 1);
  assert.equal((src.match(/taglineOption\('plantNextDoor'/g) ?? []).length, 1);
  assert.ok(!src.includes("tel:"));
  assert.match(src, /contact\.email/);
  assert.match(src, /contact\.address/);
  assert.match(src, /contact\.hours/);
});
