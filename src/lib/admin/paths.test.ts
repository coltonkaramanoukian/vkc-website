import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPath, setPath } from "./paths.ts";

describe("getPath", () => {
  it("reads a nested value", () => {
    assert.equal(getPath({ a: { b: { c: 7 } } }, "a.b.c"), 7);
  });

  it("returns undefined for a missing branch", () => {
    assert.equal(getPath({ a: {} }, "a.b.c"), undefined);
    assert.equal(getPath(null, "a"), undefined);
  });
});

describe("setPath", () => {
  it("sets a top-level key without mutating the source", () => {
    const source = { a: 1 };
    const next = setPath(source, "a", 2);
    assert.equal(next.a, 2);
    assert.equal(source.a, 1, "source must be untouched (immutability)");
    assert.notEqual(next, source);
  });

  it("builds and clones nested objects", () => {
    const source = { address: { city: "Montréal" } } as Record<string, unknown>;
    const next = setPath(source, "address.street", "100 rue Example");
    assert.deepEqual(next.address, { city: "Montréal", street: "100 rue Example" });
    assert.notEqual(next.address, source.address, "nested object must be a fresh copy");
    assert.deepEqual(source.address, { city: "Montréal" }, "source nested object untouched");
  });

  it("creates intermediate objects that do not exist yet", () => {
    const next = setPath({}, "privacyOfficer.title", { en: "x", fr: "y" });
    assert.deepEqual(next, { privacyOfficer: { title: { en: "x", fr: "y" } } });
  });
});
