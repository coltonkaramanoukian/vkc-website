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
});
