// Runtime access to content/scenes.json. Pages never read the file directly:
// a slot with nothing in it is invisible, exactly like a null photo (§1).
import scenesJson from "../../../content/scenes.json";
import type { AppPathname, Locale } from "@/i18n/pathnames";
import { isFilled, type SceneGallery, type SceneItem, type ScenesFile } from "./validate";

export type { SceneGallery, SceneItem, SceneKind } from "./validate";

const scenes = scenesJson as unknown as ScenesFile;

export const SHOW_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "1";

/** The page's cover slot, filled or not; undefined when the page has none. */
export function sceneForRoute(route: AppPathname): SceneItem | undefined {
  return scenes.slots.find((slot) => slot.page === route);
}

/** Galleries that belong to the page; only their filled items ever render. */
export function galleriesForRoute(route: AppPathname): SceneGallery[] {
  return scenes.galleries
    .filter((gallery) => gallery.page === route)
    .map((gallery) => ({ ...gallery, items: gallery.items.filter(isFilled) }));
}

/** True when a slot would put anything on the page (media, or a Preview placeholder). */
export function sceneVisible(item: SceneItem | undefined): item is SceneItem {
  return Boolean(item && (isFilled(item) || SHOW_PLACEHOLDERS));
}

export function sceneText(item: SceneItem, field: "alt" | "caption", locale: Locale): string | null {
  const value = item[field]?.[locale];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** "16/9" → "16 / 9", the value CSS aspect-ratio wants. */
export function cssAspect(aspect: string): string {
  return aspect.replace("/", " / ");
}

export { isFilled };
