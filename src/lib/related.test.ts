import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RELATED, ROUTE_PICTO } from "./related.ts";

// The route literals are type-checked already; these are the invariants the type
// cannot express, each of which would ship a broken "Keep reading" card.
describe("RELATED pages", () => {
  it("no page recommends itself", () => {
    for (const [route, targets] of Object.entries(RELATED)) {
      assert.ok(!targets.includes(route as (typeof targets)[number]), `${route} links to itself`);
    }
  });

  it("no related list repeats a page", () => {
    for (const [route, targets] of Object.entries(RELATED)) {
      assert.equal(new Set(targets).size, targets.length, `${route} has a duplicate related page`);
    }
  });

  it("every related target has a pictogram, so the card is never blank", () => {
    for (const [route, targets] of Object.entries(RELATED)) {
      for (const target of targets) {
        assert.ok(ROUTE_PICTO[target], `${route} → ${target} has no pictogram`);
      }
    }
  });
});
