import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recommend, RESULT_ROUTE } from "./chooser.ts";

describe("recommend", () => {
  it("returns nothing until both questions are answered", () => {
    assert.equal(recommend(null, null), null);
    assert.equal(recommend("shifts", null), null);
    assert.equal(recommend(null, "delivered"), null);
  });

  it("points a plant with room on the line at Second Shift", () => {
    assert.equal(recommend("shifts", "ownLine"), "secondShift");
    assert.equal(recommend("shifts", "unsure"), "secondShift");
  });

  it("points a full line at Bottleneck", () => {
    assert.equal(recommend("line", "delivered"), "bottleneck");
    assert.equal(recommend("line", "unsure"), "bottleneck");
    assert.equal(recommend("shifts", "delivered"), "bottleneck");
  });

  it("points an unmade product at toll blending whatever else is true", () => {
    assert.equal(recommend("blend", "ownLine"), "tollBlending");
    assert.equal(recommend("blend", "delivered"), "tollBlending");
    assert.equal(recommend("blend", "unsure"), "tollBlending");
  });

  it("asks for a walkthrough when the answers pull both ways", () => {
    assert.equal(recommend("line", "ownLine"), "walkthrough");
  });

  it("maps every result to a real route", () => {
    for (const route of Object.values(RESULT_ROUTE)) {
      assert.ok(route.startsWith("/"), route);
    }
  });
});
