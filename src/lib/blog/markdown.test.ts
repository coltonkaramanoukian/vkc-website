import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBlocks, parseInline } from "./markdown.ts";

describe("parseInline", () => {
  it("returns a single text node for plain text", () => {
    assert.deepEqual(parseInline("hello world"), [{ type: "text", value: "hello world" }]);
  });

  it("parses bold, italic and code", () => {
    assert.deepEqual(parseInline("**b**"), [{ type: "strong", children: [{ type: "text", value: "b" }] }]);
    assert.deepEqual(parseInline("*i*"), [{ type: "em", children: [{ type: "text", value: "i" }] }]);
    assert.deepEqual(parseInline("`c`"), [{ type: "code", value: "c" }]);
  });

  it("prefers ** over * at the same position", () => {
    const nodes = parseInline("**strong**");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].type, "strong");
  });

  it("keeps surrounding text around an emphasis span", () => {
    assert.deepEqual(parseInline("a **b** c"), [
      { type: "text", value: "a " },
      { type: "strong", children: [{ type: "text", value: "b" }] },
      { type: "text", value: " c" },
    ]);
  });

  it("parses a link, carrying the target through", () => {
    const nodes = parseInline("see [services](/services) now");
    assert.equal(nodes[1].type, "link");
    assert.equal((nodes[1] as { target: string }).target, "/services");
  });
});

describe("parseBlocks", () => {
  it("splits paragraphs on blank lines and joins wrapped lines", () => {
    const blocks = parseBlocks("one\nstill one\n\ntwo");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].type, "paragraph");
    assert.deepEqual(blocks[0], { type: "paragraph", children: [{ type: "text", value: "one still one" }] });
  });

  it("reads ## and ### as headings of the right level", () => {
    const blocks = parseBlocks("## Two\n### Three");
    assert.deepEqual(
      blocks.map((b) => (b.type === "heading" ? b.level : null)),
      [2, 3],
    );
  });

  it("groups consecutive bullets into one unordered list", () => {
    const blocks = parseBlocks("- a\n- b\n- c");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "list");
    assert.equal((blocks[0] as { ordered: boolean }).ordered, false);
    assert.equal((blocks[0] as { items: unknown[] }).items.length, 3);
  });

  it("reads a numbered list as ordered", () => {
    const blocks = parseBlocks("1. a\n2. b");
    assert.equal((blocks[0] as { ordered: boolean }).ordered, true);
  });

  it("joins a multi-line blockquote", () => {
    const blocks = parseBlocks("> line one\n> line two");
    assert.deepEqual(blocks[0], { type: "blockquote", children: [{ type: "text", value: "line one line two" }] });
  });

  it("ignores blank lines and returns nothing for an empty body", () => {
    assert.deepEqual(parseBlocks(""), []);
    assert.deepEqual(parseBlocks("\n\n  \n"), []);
  });
});
