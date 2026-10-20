import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { localizedPath, noindexRoutes, routes } from "../i18n/pathnames.ts";
import { navGroups, pageKeyFor } from "./nav.ts";
import { RELATED, ROUTE_PICTO } from "./related.ts";

// SITE-GAPS C8. The sitemap, the hreflang alternates, the guards and the
// census all enumerate `routes` minus `noindexRoutes` (src/app/sitemap.ts,
// src/lib/seo.ts, scripts/lib/routes.ts), so these are the facts that put the
// page in all of them. e2e/bottleneck-page.spec.ts checks the rendered result.
describe("the Bottleneck / Goulot route", () => {
  it("has its own slug in each locale", () => {
    assert.equal(localizedPath("en", "/services/bottleneck"), "/en/services/bottleneck");
    assert.equal(localizedPath("fr", "/services/bottleneck"), "/fr/services/goulot");
  });

  it("is a real, indexable page, so it is in the sitemap and the hreflang set", () => {
    assert.ok(routes.includes("/services/bottleneck"));
    assert.ok(!noindexRoutes.includes("/services/bottleneck"));
  });

  it("sits in the Services menu right after Second Shift", () => {
    const services = navGroups.find((g) => g.key === "services");
    assert.deepEqual(
      services?.items.map((i) => i.route),
      ["/services/second-shift", "/services/bottleneck", "/services/contract-packaging", "/services/toll-blending"],
    );
  });

  it("has a pictogram and a Keep reading list", () => {
    assert.ok(ROUTE_PICTO["/services/bottleneck"]);
    assert.equal(RELATED["/services/bottleneck"]?.length, 3);
  });

  it("has its menu label, metadata and page copy in both message files", () => {
    const key = pageKeyFor("/services/bottleneck");
    assert.equal(key, "bottleneck");
    for (const locale of ["en", "fr"]) {
      const messages = JSON.parse(readFileSync(new URL(`../../i18n/messages/${locale}.json`, import.meta.url), "utf8"));
      assert.equal(messages.common.nav[key], "{bn}", `${locale} common.nav.${key}`);
      assert.ok(messages.meta[key]?.title && messages.meta[key]?.description, `${locale} meta.${key}`);
      for (const field of ["eyebrow", "h1", "lead", "scope", "slogan", "contact", "jobsHeading"]) {
        assert.ok(messages.pages[key]?.[field], `${locale} pages.${key}.${field}`);
      }
    }
  });

  it("is one of the services hub's pages, and the hub counts it", () => {
    for (const locale of ["en", "fr"]) {
      const messages = JSON.parse(readFileSync(new URL(`../../i18n/messages/${locale}.json`, import.meta.url), "utf8"));
      const hub = messages.pages.services;
      assert.ok(hub.cards.bottleneck, `${locale} pages.services.cards.bottleneck`);
      const pages = hub.sections.find((s: { slot?: string }) => s.slot === "pages");
      assert.match(pages.body.join(" "), /\]\(\/services\/bottleneck\)/, `${locale} hub links the page`);
      const services = navGroups.find((g) => g.key === "services");
      const count = { en: "Four", fr: "Quatre" }[locale];
      assert.equal(services?.items.length, 4);
      assert.ok(pages.h2.startsWith(`${count} pages`), `${locale} hub h2: ${pages.h2}`);
    }
  });

  // The service name {bn} links to its own page everywhere, except where the
  // sentence is about the fill side alone (the contract packaging glossary
  // entry: "the fill side of {bn}"), which stays on contract packaging.
  it("is linked by its name to its own page, not to contract packaging", () => {
    const FILL_SIDE = { en: "the fill side of [{bn}]", fr: "volet remplissage de [{bn}]" };
    for (const locale of ["en", "fr"] as const) {
      const messages = JSON.parse(readFileSync(new URL(`../../i18n/messages/${locale}.json`, import.meta.url), "utf8"));
      const links: { path: string; href: string; text: string }[] = [];
      const walk = (node: unknown, path: string) => {
        if (typeof node === "string") {
          for (const m of node.matchAll(/\[\{bn\}\]\(([^)]*)\)/g)) links.push({ path, href: m[1], text: node });
        } else if (node && typeof node === "object") {
          for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
        }
      };
      walk(messages, locale);
      assert.ok(links.length > 0, `${locale} has {bn} links`);
      for (const l of links) {
        if (l.text.includes(FILL_SIDE[locale])) {
          assert.equal(l.href, "/services/contract-packaging", `${l.path} (fill side only)`);
        } else {
          assert.equal(l.href, "/services/bottleneck", `${l.path} links ${l.href}`);
        }
      }
      // The two entries named in the bug: the about page and the glossary's Bottleneck entry.
      const about = links.filter((l) => /about/i.test(l.path));
      const glossary = links.filter((l) => /glossary/i.test(l.path) && !l.text.includes(FILL_SIDE[locale]));
      assert.ok(about.length > 0, `${locale} about page links {bn}`);
      assert.ok(glossary.length > 0, `${locale} glossary Bottleneck entry links {bn}`);
    }
  });

  it("resolves that link to the English and French slugs", () => {
    assert.equal(localizedPath("en", "/services/bottleneck"), "/en/services/bottleneck");
    assert.equal(localizedPath("fr", "/services/bottleneck"), "/fr/services/goulot");
  });
});
