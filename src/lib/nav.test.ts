import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupOf, navGroups, navLabelKey, pageKeyFor, primaryNav } from "./nav.ts";

describe("groupOf", () => {
  it("finds the group for a hub and for an item", () => {
    assert.equal(groupOf("/services")?.key, "services");
    assert.equal(groupOf("/services/second-shift")?.key, "services");
    assert.equal(groupOf("/containers/pails")?.key, "containers");
    assert.equal(groupOf("/locations/montreal")?.key, "regions");
    assert.equal(groupOf("/quote")?.key, "company");
  });

  it("returns undefined for the home page and for a route outside the nav", () => {
    assert.equal(groupOf("/"), undefined);
    assert.equal(groupOf("/visit"), undefined);
  });
});

describe("navLabelKey", () => {
  it("returns the group key for a hub and the item label for a child", () => {
    assert.equal(navLabelKey("/services"), "services");
    assert.equal(navLabelKey("/services/second-shift"), "secondShift");
    assert.equal(navLabelKey("/industries/sealers-and-coatings"), "sealersCoatings");
  });

  it("returns undefined off-nav", () => {
    assert.equal(navLabelKey("/"), undefined);
    assert.equal(navLabelKey("/visit"), undefined);
  });
});

describe("pageKeyFor", () => {
  it("camel-cases the last path segment", () => {
    assert.equal(pageKeyFor("/containers/bottles-and-jugs"), "bottlesAndJugs");
    assert.equal(pageKeyFor("/services/second-shift"), "secondShift");
    assert.equal(pageKeyFor("/about"), "about");
  });
});

describe("nav structure invariants", () => {
  const allRoutes = navGroups.flatMap((g) => [...(g.hub ? [g.hub] : []), ...g.items.map((i) => i.route)]);

  it("every primary-nav route exists in the groups (header can't point off-site)", () => {
    for (const item of primaryNav) {
      assert.ok(allRoutes.includes(item.route), `primaryNav ${item.route} not in navGroups`);
    }
  });

  it("every route in the nav is unique (no page listed twice)", () => {
    assert.equal(new Set(allRoutes).size, allRoutes.length);
  });

  it("keeps Regions out of the primary nav but in the groups (the 72rem overflow decision)", () => {
    assert.ok(!primaryNav.some((i) => i.route === "/locations/montreal"));
    assert.ok(navGroups.some((g) => g.key === "regions"));
  });
});
