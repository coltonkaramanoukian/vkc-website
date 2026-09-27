import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFilled, MAX_BYTES, summarize, validateScenes, type Files, type SceneItem, type ScenesFile } from "./validate.ts";

const ROUTES = ["/", "/about", "/services/second-shift"];

const files = (present: Record<string, number>): Files => ({
  sizeOf: (path) => (path in present ? present[path] : null),
});

const empty = (over: Partial<SceneItem> = {}): SceneItem => ({
  id: "home-cover",
  page: "/",
  intent: "The line running.",
  aspect: "21/9",
  kind: null,
  src: null,
  poster: null,
  alt: { en: null, fr: null },
  caption: { en: null, fr: null },
  portrait: null,
  ...over,
});

const image = (over: Partial<SceneItem> = {}): SceneItem =>
  empty({ kind: "image", src: "/media/home.webp", alt: { en: "The line", fr: "La ligne" }, ...over });

const video = (over: Partial<SceneItem> = {}): SceneItem =>
  empty({
    kind: "video",
    src: "/media/home.mp4",
    poster: "/media/home-poster.webp",
    alt: { en: "The line", fr: "La ligne" },
    ...over,
  });

const file = (slots: SceneItem[], galleries: ScenesFile["galleries"] = []): ScenesFile => ({ slots, galleries });
const messages = (issues: { message: string }[]) => issues.map((i) => i.message);

describe("validateScenes", () => {
  it("accepts the all-null manifest", () => {
    assert.deepEqual(validateScenes(file([empty()]), ROUTES, files({})), []);
  });

  it("accepts a filled image slot whose file exists", () => {
    const fs = files({ "/media/home.webp": 100 * 1024 });
    assert.deepEqual(validateScenes(file([image()]), ROUTES, fs), []);
  });

  it("accepts a filled video slot with a poster", () => {
    const fs = files({ "/media/home.mp4": 5 * 1024 * 1024, "/media/home-poster.webp": 80 * 1024 });
    assert.deepEqual(validateScenes(file([video()]), ROUTES, fs), []);
  });

  it("rejects a src whose file is missing", () => {
    const issues = validateScenes(file([image()]), ROUTES, files({}));
    assert.match(messages(issues).join("\n"), /does not exist under public\//);
  });

  it("rejects a src outside /media/", () => {
    const fs = files({ "/photos/x.webp": 1000 });
    const issues = validateScenes(file([image({ src: "/photos/x.webp" })]), ROUTES, fs);
    assert.match(messages(issues).join("\n"), /must start with \/media\//);
  });

  it("rejects a remote src", () => {
    const issues = validateScenes(file([image({ src: "https://cdn.example.com/x.webp" })]), ROUTES, files({}));
    assert.match(messages(issues).join("\n"), /must start with \/media\//);
  });

  it("rejects an image over budget", () => {
    const fs = files({ "/media/home.webp": MAX_BYTES.image + 1 });
    const issues = validateScenes(file([image()]), ROUTES, fs);
    assert.match(messages(issues).join("\n"), /budget/);
  });

  it("rejects a video without a poster", () => {
    const fs = files({ "/media/home.mp4": 1000 });
    const issues = validateScenes(file([video({ poster: null })]), ROUTES, fs);
    assert.match(messages(issues).join("\n"), /poster must be a non-empty string/);
  });

  it("rejects a video with an image extension", () => {
    const fs = files({ "/media/home.webp": 1000, "/media/home-poster.webp": 1000 });
    const issues = validateScenes(file([video({ src: "/media/home.webp" })]), ROUTES, fs);
    assert.match(messages(issues).join("\n"), /must end in \.mp4, \.webm/);
  });

  it("requires alt in both locales once filled", () => {
    const fs = files({ "/media/home.webp": 1000 });
    const issues = validateScenes(file([image({ alt: { en: "The line", fr: null } })]), ROUTES, fs);
    assert.match(messages(issues).join("\n"), /alt\.fr is required/);
  });

  it("rejects kind without src and src without kind", () => {
    const fs = files({ "/media/home.webp": 1000 });
    const a = validateScenes(file([empty({ kind: "image" })]), ROUTES, fs);
    const b = validateScenes(file([empty({ src: "/media/home.webp" })]), ROUTES, fs);
    assert.match(messages(a).join("\n"), /kind is set but src is null/);
    assert.match(messages(b).join("\n"), /src is set but kind is null/);
  });

  it("rejects an unknown page and a bad aspect", () => {
    const issues = validateScenes(file([empty({ page: "/nowhere", aspect: "wide" })]), ROUTES, files({}));
    const text = messages(issues).join("\n");
    assert.match(text, /not a route/);
    assert.match(text, /aspect must look like/);
  });

  it("rejects two covers for one page and duplicate ids", () => {
    const issues = validateScenes(file([empty(), empty({ id: "home-cover" })]), ROUTES, files({}));
    const text = messages(issues).join("\n");
    assert.match(text, /duplicate id/);
    assert.match(text, /a page has one cover/);
  });

  it("rejects a null gallery item and accepts a filled one", () => {
    const fs = files({ "/media/g1.webp": 1000 });
    const bad = validateScenes(file([], [{ id: "home-floor", page: "/", intent: "Stills.", items: [empty({ id: "g0" })] }]), ROUTES, fs);
    assert.match(messages(bad).join("\n"), /must be filled/);
    const good = validateScenes(
      file([], [{ id: "home-floor", page: "/", intent: "Stills.", items: [image({ id: "g1", src: "/media/g1.webp" })] }]),
      ROUTES,
      fs,
    );
    assert.deepEqual(good, []);
  });

  it("validates the portrait variant against the same rules", () => {
    const fs = files({ "/media/home.mp4": 1000, "/media/home-poster.webp": 1000 });
    const issues = validateScenes(
      file([video({ portrait: { src: "/media/home-portrait.mp4", poster: "/media/home-portrait.webp", aspect: "9/16" } })]),
      ROUTES,
      fs,
    );
    assert.equal(issues.filter((i) => i.where.endsWith(".portrait")).length, 2);
  });

  it("refuses something that is not a manifest", () => {
    assert.equal(validateScenes(null, ROUTES, files({})).length, 1);
    assert.equal(validateScenes({ slots: {} }, ROUTES, files({})).length, 2);
  });
});

describe("isFilled / summarize", () => {
  it("counts filled slots and gallery items", () => {
    assert.equal(isFilled(empty()), false);
    assert.equal(isFilled(image()), true);
    const s = summarize(file([empty(), image({ id: "about-cover", page: "/about" })], [{ id: "g", page: "/", intent: "x", items: [image({ id: "i" })] }]));
    assert.deepEqual(s, { slots: 2, filledSlots: 1, galleries: 1, galleryItems: 1 });
  });
});
