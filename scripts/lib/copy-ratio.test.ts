// The ±10% gate must measure what the page renders: a SpecGrid's labels are
// copy the moment capabilities.json is filled, and the contact placard's row
// names are copy the moment contact.json is. Both were missing from the
// namespace map (audit round two, confirmed by both skeptics).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { copyLength, namespacesFor, SPEC_LABEL_KEYS } from "./copy-ratio.ts";

type Tree = Record<string, unknown>;
const load = (l: string) => JSON.parse(readFileSync(`i18n/messages/${l}.json`, "utf8")) as Tree;
const get = (tree: Tree, path: string) => path.split(".").reduce<unknown>((n, k) => (n as Tree | undefined)?.[k], tree);

test("every SpecGrid label key names a string in both message files", () => {
  const en = load("en");
  const fr = load("fr");
  for (const [route, keys] of Object.entries(SPEC_LABEL_KEYS)) {
    assert.ok(keys.length > 0, `${route} lists no keys`);
    for (const key of ["title", ...keys]) {
      assert.equal(typeof get(en, `common.specLabels.${key}`), "string", `en common.specLabels.${key} (${route})`);
      assert.equal(typeof get(fr, `common.specLabels.${key}`), "string", `fr common.specLabels.${key} (${route})`);
    }
  }
});

test("a route with a SpecGrid measures its spec labels; one without does not", () => {
  const ss = namespacesFor("/services/second-shift");
  assert.ok(ss.includes("common.specLabels.title"));
  assert.ok(ss.includes("common.specLabels.crewSize"));
  assert.ok(!ss.includes("common.specLabels.fillers"), "second shift renders no filler row");
  assert.ok(!namespacesFor("/about").some((ns) => ns.startsWith("common.specLabels")));
});

test("the contact page measures the placard's row names", () => {
  assert.ok(namespacesFor("/contact").includes("common.contact"));
});

test("adding a namespace lengthens the measured copy", () => {
  const without = copyLength("en", ["pages.secondShift"]);
  const withSpecs = copyLength("en", namespacesFor("/services/second-shift"));
  assert.ok(withSpecs > without);
});
