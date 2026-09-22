import { media } from "@/lib/content";
import type { Locale } from "@/i18n/pathnames";

/**
 * The demo video slot (content/media.json, filled only by the video run).
 * Null → renders nothing. Filled → 9:16 on narrow viewports, 16:9 on wide;
 * never autoplays, never loads until the viewer presses play.
 */
export function DemoVideo({ locale, label }: { locale: Locale; label: string }) {
  const demo = media.demo[locale];
  const portrait = demo.portrait;
  const landscape = demo.landscape;
  if (!portrait && !landscape) return null;

  const video = (src: string, poster: string | null, className: string) => (
    <video
      className={`w-full border-[1.5px] border-ink bg-ink ${className}`}
      src={src}
      poster={poster ?? undefined}
      preload="none"
      muted
      playsInline
      controls
      aria-label={label}
    />
  );

  if (portrait && landscape) {
    return (
      <div>
        {video(portrait, demo.portraitPoster, "aspect-[9/16] md:hidden")}
        {video(landscape, demo.landscapePoster, "hidden aspect-video md:block")}
      </div>
    );
  }
  return portrait
    ? video(portrait, demo.portraitPoster, "aspect-[9/16] max-w-sm")
    : video(landscape as string, demo.landscapePoster, "aspect-video");
}
