// content/scenes.json: the media manifest, validated. Pure functions — no
// imports, no I/O — so the guard script, the tests and the site share one
// definition of "a valid scene". File existence and sizes come in through
// the `Files` port; the rules about them live here.

export type SceneKind = "image" | "video";

export interface LocalizedField {
  en: string | null;
  fr: string | null;
}

export interface ScenePortrait {
  src: string;
  poster: string | null;
  aspect: string;
}

export interface SceneItem {
  id: string;
  page: string;
  intent: string;
  /** "W/H", e.g. "16/9". Reserves the box before the file arrives (no layout shift). */
  aspect: string;
  kind: SceneKind | null;
  /** Absolute path under /media/. */
  src: string | null;
  /** Video only: a still of the same shot, shown until the loop plays. */
  poster: string | null;
  alt: LocalizedField;
  caption?: LocalizedField;
  /** Optional 9:16 variant for phones. */
  portrait?: ScenePortrait | null;
}

export interface SceneGallery {
  id: string;
  page: string;
  intent: string;
  items: SceneItem[];
}

export interface ScenesFile {
  slots: SceneItem[];
  galleries: SceneGallery[];
}

export interface Files {
  /** Byte size of a public path (e.g. "/media/x.mp4"), or null when the file does not exist. */
  sizeOf(publicPath: string): number | null;
}

export interface Issue {
  where: string;
  message: string;
}

export const MEDIA_ROOT = "/media/";
export const IMAGE_EXTENSIONS = [".avif", ".webp", ".jpg", ".jpeg", ".png"] as const;
export const VIDEO_EXTENSIONS = [".mp4", ".webm"] as const;

/** Budgets. A page carries at most one cover and one gallery; these keep it under a few MB. */
export const MAX_BYTES = {
  image: 600 * 1024,
  poster: 300 * 1024,
  video: 12 * 1024 * 1024,
} as const;

const ASPECT = /^\d{1,3}\/\d{1,3}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const extensionOf = (path: string): string => {
  const clean = path.split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot).toLowerCase() : "";
};

const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** A filled item is one with a kind or a src: either alone is a half-filled slot. */
export function isFilled(item: Pick<SceneItem, "kind" | "src">): boolean {
  return item.kind !== null || item.src !== null;
}

function checkPath(
  where: string,
  label: string,
  path: unknown,
  allowed: readonly string[],
  budget: number,
  files: Files,
  issues: Issue[],
): void {
  if (!isText(path)) {
    issues.push({ where, message: `${label} must be a non-empty string` });
    return;
  }
  if (!path.startsWith(MEDIA_ROOT)) {
    issues.push({ where, message: `${label} must start with ${MEDIA_ROOT} (got ${JSON.stringify(path)})` });
  }
  if (!allowed.includes(extensionOf(path))) {
    issues.push({ where, message: `${label} must end in ${allowed.join(", ")} (got ${JSON.stringify(path)})` });
  }
  const size = files.sizeOf(path);
  if (size === null) {
    issues.push({ where, message: `${label} ${path} does not exist under public/` });
  } else if (size > budget) {
    issues.push({
      where,
      message: `${label} ${path} is ${(size / 1024).toFixed(0)} kB; budget ${(budget / 1024).toFixed(0)} kB`,
    });
  }
}

function checkLocalized(where: string, label: string, value: unknown, required: boolean, issues: Issue[]): void {
  if (value === undefined || value === null) {
    if (required) issues.push({ where, message: `${label} is required in both locales` });
    return;
  }
  if (typeof value !== "object") {
    issues.push({ where, message: `${label} must be { en, fr }` });
    return;
  }
  const field = value as Partial<LocalizedField>;
  for (const locale of ["en", "fr"] as const) {
    const text = field[locale];
    if (required && !isText(text)) issues.push({ where, message: `${label}.${locale} is required` });
    if (text !== null && text !== undefined && typeof text !== "string") {
      issues.push({ where, message: `${label}.${locale} must be a string or null` });
    }
  }
}

function checkItem(where: string, item: SceneItem, knownRoutes: readonly string[], files: Files, issues: Issue[]): void {
  if (!ID.test(item.id ?? "")) issues.push({ where, message: `id must be kebab-case (got ${JSON.stringify(item.id)})` });
  if (!knownRoutes.includes(item.page)) {
    issues.push({ where, message: `page ${JSON.stringify(item.page)} is not a route in src/i18n/pathnames.ts` });
  }
  if (!isText(item.intent)) issues.push({ where, message: "intent must say what the slot should show" });
  if (!ASPECT.test(item.aspect ?? "")) {
    issues.push({ where, message: `aspect must look like "16/9" (got ${JSON.stringify(item.aspect)})` });
  }
  if (item.kind !== null && item.kind !== "image" && item.kind !== "video") {
    issues.push({ where, message: `kind must be "image", "video" or null (got ${JSON.stringify(item.kind)})` });
  }

  if (!isFilled(item)) {
    if (item.poster !== null && item.poster !== undefined) issues.push({ where, message: "poster set on an empty slot" });
    checkLocalized(where, "alt", item.alt, false, issues);
    checkLocalized(where, "caption", item.caption, false, issues);
    return;
  }

  if (item.kind === null) issues.push({ where, message: "src is set but kind is null" });
  if (item.src === null) issues.push({ where, message: "kind is set but src is null" });
  if (item.kind === "image") {
    checkPath(where, "src", item.src, IMAGE_EXTENSIONS, MAX_BYTES.image, files, issues);
    if (item.poster !== null && item.poster !== undefined) issues.push({ where, message: "poster only applies to a video" });
  }
  if (item.kind === "video") {
    checkPath(where, "src", item.src, VIDEO_EXTENSIONS, MAX_BYTES.video, files, issues);
    checkPath(where, "poster", item.poster, IMAGE_EXTENSIONS, MAX_BYTES.poster, files, issues);
  }
  checkLocalized(where, "alt", item.alt, true, issues);
  checkLocalized(where, "caption", item.caption, false, issues);

  if (item.portrait !== null && item.portrait !== undefined) {
    const p = item.portrait;
    const pw = `${where}.portrait`;
    if (!ASPECT.test(p.aspect ?? "")) issues.push({ where: pw, message: `aspect must look like "9/16"` });
    if (item.kind === "video") {
      checkPath(pw, "src", p.src, VIDEO_EXTENSIONS, MAX_BYTES.video, files, issues);
      checkPath(pw, "poster", p.poster, IMAGE_EXTENSIONS, MAX_BYTES.poster, files, issues);
    } else {
      checkPath(pw, "src", p.src, IMAGE_EXTENSIONS, MAX_BYTES.image, files, issues);
    }
  }
}

/** Every problem in the manifest; an empty list means the file is sound. */
export function validateScenes(input: unknown, knownRoutes: readonly string[], files: Files): Issue[] {
  const issues: Issue[] = [];
  if (!input || typeof input !== "object") return [{ where: "scenes.json", message: "not an object" }];
  const file = input as Partial<ScenesFile>;
  if (!Array.isArray(file.slots)) issues.push({ where: "scenes.json", message: "slots must be an array" });
  if (!Array.isArray(file.galleries)) issues.push({ where: "scenes.json", message: "galleries must be an array" });
  if (issues.length > 0) return issues;

  const ids = new Set<string>();
  const seen = (where: string, id: string) => {
    if (ids.has(id)) issues.push({ where, message: `duplicate id ${JSON.stringify(id)}` });
    ids.add(id);
  };

  const pagesWithSlot = new Set<string>();
  (file.slots as SceneItem[]).forEach((slot, index) => {
    const where = `slots[${index}] (${slot?.id ?? "?"})`;
    seen(where, slot.id);
    if (pagesWithSlot.has(slot.page)) issues.push({ where, message: `a second slot for page ${slot.page}; a page has one cover` });
    pagesWithSlot.add(slot.page);
    checkItem(where, slot, knownRoutes, files, issues);
  });

  (file.galleries as SceneGallery[]).forEach((gallery, gIndex) => {
    const where = `galleries[${gIndex}] (${gallery?.id ?? "?"})`;
    seen(where, gallery.id);
    if (!knownRoutes.includes(gallery.page)) {
      issues.push({ where, message: `page ${JSON.stringify(gallery.page)} is not a route in src/i18n/pathnames.ts` });
    }
    if (!isText(gallery.intent)) issues.push({ where, message: "intent must say what the gallery should show" });
    if (!Array.isArray(gallery.items)) {
      issues.push({ where, message: "items must be an array" });
      return;
    }
    gallery.items.forEach((item, index) => {
      const itemWhere = `${where}.items[${index}] (${item?.id ?? "?"})`;
      seen(itemWhere, item.id);
      if (!isFilled(item)) issues.push({ where: itemWhere, message: "a gallery item must be filled; remove it instead of leaving it null" });
      checkItem(itemWhere, { ...item, page: item.page ?? gallery.page }, knownRoutes, files, issues);
    });
  });

  return issues;
}

/** Counts for the guard's summary line. */
export function summarize(file: ScenesFile): { slots: number; filledSlots: number; galleries: number; galleryItems: number } {
  return {
    slots: file.slots.length,
    filledSlots: file.slots.filter(isFilled).length,
    galleries: file.galleries.length,
    galleryItems: file.galleries.reduce((n, g) => n + g.items.length, 0),
  };
}
