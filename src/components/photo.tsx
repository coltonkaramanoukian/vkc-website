import Image from "next/image";
import { localized, photoSlot } from "@/lib/content";
import type { Locale } from "@/i18n/pathnames";

const SHOW_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "1";

/**
 * D4. A real photo when content/photos.json has a src; on Preview only, a
 * labelled placeholder; otherwise NOTHING (no wrapper, no broken image).
 */
export function Photo({
  id,
  locale,
  className = "",
}: {
  id: string;
  locale: Locale;
  className?: string;
}) {
  const slot = photoSlot(id);
  if (!slot) return null;

  if (slot.src) {
    const alt = localized(slot.alt, locale) ?? "";
    // With width and height on the slot, next/image reserves the box and serves
    // sized, modern formats. Without them, a plain <img> (it shifts layout while
    // it loads; guard:media says so). See docs/CONTENT-INTAKE.md.
    const sized = typeof slot.width === "number" && typeof slot.height === "number";
    return (
      <figure className={className}>
        {sized ? (
          <Image
            src={slot.src}
            alt={alt}
            width={slot.width}
            height={slot.height}
            sizes="(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw"
            className="h-auto w-full border-[1.5px] border-ink"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.src} alt={alt} loading="lazy" decoding="async" className="h-auto w-full border-[1.5px] border-ink" />
        )}
      </figure>
    );
  }

  if (SHOW_PLACEHOLDERS) {
    return (
      <div className={`vkc-photo-placeholder ${className}`} data-photo-slot={slot.id}>
        PHOTO: {slot.intent}
      </div>
    );
  }

  return null;
}

/** True when a slot would render anything (a photo, or a Preview placeholder). */
export function photoVisible(id: string): boolean {
  const slot = photoSlot(id);
  return Boolean(slot && (slot.src || SHOW_PLACEHOLDERS));
}

/** A row of photo slots. With nothing to show, the wrapper itself is not rendered. */
export function PhotoRow({
  ids,
  locale,
  className = "",
}: {
  ids: string[];
  locale: Locale;
  className?: string;
}) {
  const visible = ids.filter(photoVisible);
  if (visible.length === 0) return null;
  return (
    <div className={`grid gap-5 ${visible.length > 1 ? "md:grid-cols-2" : ""} ${className}`}>
      {visible.map((id) => (
        <Photo key={id} id={id} locale={locale} />
      ))}
    </div>
  );
}
