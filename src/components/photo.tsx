import Image from "next/image";
import { localized, photoSlot, type PhotoSlot } from "@/lib/content";
import { localImageSize } from "@/lib/local-image";
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
    // With a size, next/image reserves the box and serves sized, modern
    // formats. The size comes from the slot when Colton typed one, else from
    // the file's own header. Only a format we cannot read falls back to a
    // plain <img>, which shifts layout while it loads (guard:media says so).
    const size = photoSize(slot);
    return (
      <figure className={className}>
        {size ? (
          <Image
            src={slot.src}
            alt={alt}
            width={size.width}
            height={size.height}
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
        PHOTO {slot.id}: {slot.intent}
      </div>
    );
  }

  return null;
}

/** The slot's declared size, else the size read from the file; null when neither is known. */
function photoSize(slot: PhotoSlot): { width: number; height: number } | null {
  if (typeof slot.width === "number" && typeof slot.height === "number") {
    return { width: slot.width, height: slot.height };
  }
  return slot.src ? localImageSize(slot.src) : null;
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
