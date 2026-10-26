import { test } from "node:test";
import assert from "node:assert/strict";
import { callbackLine } from "./callback.ts";

test("formats phone, tel href and slogan", () => {
  assert.deepEqual(callbackLine(" +1 (514) 555-0100 ", " Call us back. "), {
    text: "+1 (514) 555-0100",
    href: "tel:+15145550100",
    slogan: "Call us back.",
  });
});

test("no leading plus means no plus in href", () => {
  assert.deepEqual(callbackLine("514-555-0100", ""), {
    text: "514-555-0100",
    href: "tel:5145550100",
    slogan: null,
  });
});

test("null slogan returns slogan null", () => {
  assert.deepEqual(callbackLine("514-555-0100", null), {
    text: "514-555-0100",
    href: "tel:5145550100",
    slogan: null,
  });
});

test("blank slogan becomes null", () => {
  assert.equal(callbackLine("514-555-0100", "   ")?.slogan, null);
  assert.equal(callbackLine("514-555-0100", undefined)?.slogan, null);
});

test("missing or digitless phone renders nothing", () => {
  assert.equal(callbackLine(null, "x"), null);
  assert.equal(callbackLine(undefined, "x"), null);
  assert.equal(callbackLine("   ", "x"), null);
  assert.equal(callbackLine("call us", "x"), null);
});
