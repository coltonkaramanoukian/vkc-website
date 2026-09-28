import Image from "next/image";
import { AmbientVideo } from "@/components/ambient-video";
import { getCopy } from "@/lib/i18n";
import {
  cssAspect,
  galleriesForRoute,
  isFilled,
  sceneForRoute,
  SHOW_PLACEHOLDERS,
  sceneText,
  sceneVisible,
  type SceneItem,
} from "@/lib/scenes";
import type { AppPathname, Locale } from "@/i18n/pathnames";
import type { CSSProperties } from "react";

/** The page column is 72rem wide; a cover fills it, a gallery tile takes a third. */
const COVER_SIZES = "(min-width: 1152px) 1152px, 100vw";
const TILE_SIZES = "(min-width: 768px) 384px, 85vw";

/**
 * One media slot from content/scenes.json. An image renders through next/image
 * (sized, lazy unless `preload`); a video renders as an ambient loop with a
 * poster. The box is reserved by `aspect` so nothing shifts when the file
 * arrives. Empty → a labelled placeholder on Preview, nothing in production.
 */
export async function Scene({
  item,
  locale,
  sizes = COVER_SIZES,
  preload = false,
  className = "",
}: {
  item: SceneItem;
  locale: Locale;
  sizes?: string;
  preload?: boolean;
  className?: string;
}) {
  const style = { "--scene-aspect": cssAspect(item.aspect) } as CSSProperties;

  if (!isFilled(item)) {
    if (!SHOW_PLACEHOLDERS) return null;
    return (
      <div className={`scene ${className}`} style={style} data-scene-slot={item.id}>
        <div className="scene-frame vkc-photo-placeholder">
          SCENE ({item.aspect}): {item.intent}
        </div>
      </div>
    );
  }

  const { t } = await getCopy(locale, "common.media");
  const alt = sceneText(item, "alt", locale) ?? "";
  const caption = sceneText(item, "caption", locale);
  const portrait = item.portrait ?? null;

  const media = (src: string, poster: string | null, extra = "") =>
    item.kind === "video" ? (
      <AmbientVideo
        src={src}
        poster={poster}
        label={alt}
        playLabel={t("play")}
        pauseLabel={t("pause")}
        className={`scene-media ${extra}`}
      />
    ) : (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        loading={preload ? undefined : "lazy"}
        className={`scene-media ${extra}`}
      />
    );

  return (
    <figure className={`scene ${className}`} style={style} data-scene-slot={item.id}>
      {portrait ? (
        <>
          <div className="scene-frame md:hidden" style={{ "--scene-aspect": cssAspect(portrait.aspect) } as CSSProperties}>
            {media(portrait.src, portrait.poster)}
          </div>
          <div className="scene-frame hidden md:block">{media(item.src as string, item.poster)}</div>
        </>
      ) : (
        <div className="scene-frame">{media(item.src as string, item.poster)}</div>
      )}
      {caption && <figcaption className="field-name mt-3">{caption}</figcaption>}
    </figure>
  );
}

/** The page's cover, if content/scenes.json has one for this route. */
export async function SceneCover({
  route,
  locale,
  preload = false,
  className = "",
}: {
  route: AppPathname;
  locale: Locale;
  preload?: boolean;
  className?: string;
}) {
  const item = sceneForRoute(route);
  if (!sceneVisible(item)) return null;
  return <Scene item={item} locale={locale} preload={preload} className={className} />;
}

/**
 * The page's galleries. On a phone the tiles scroll sideways and snap; from
 * `md` they sit in a grid. A gallery with no filled item renders nothing.
 */
export async function SceneGalleries({ route, locale, className = "" }: { route: AppPathname; locale: Locale; className?: string }) {
  const galleries = galleriesForRoute(route).filter((gallery) => gallery.items.length > 0 || SHOW_PLACEHOLDERS);
  if (galleries.length === 0) return null;
  return (
    <>
      {galleries.map((gallery) => (
        <section key={gallery.id} className={`wrap mt-14 ${className}`} aria-label={gallery.id} data-scene-gallery={gallery.id}>
          {gallery.items.length === 0 ? (
            <div className="vkc-photo-placeholder" data-scene-slot={gallery.id}>
              GALLERY: {gallery.intent}
            </div>
          ) : (
            <ul className="gallery" data-count={Math.min(gallery.items.length, 3)} tabIndex={0}>
              {gallery.items.map((item) => (
                <li key={item.id}>
                  <Scene item={item} locale={locale} sizes={TILE_SIZES} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
