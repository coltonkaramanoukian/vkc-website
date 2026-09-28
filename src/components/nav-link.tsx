import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A chrome link (header, menu, footer) that knows which page it is on.
 *
 * A soft navigation to the page's own URL changes no route segment, so the
 * app router neither re-renders nor scrolls: a reader at the bottom of a
 * page who clicks that page's name in the footer sees nothing happen. For
 * the current page the link is a plain anchor instead, which reloads and
 * lands at the top, the thing the click asked for. Every other target stays
 * a next/link, prefetched and client-side.
 */
export function NavLink({
  href,
  current,
  className,
  "aria-label": ariaLabel,
  children,
}: {
  href: string;
  current: boolean;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  if (current) {
    return (
      <a href={href} className={className} aria-label={ariaLabel} aria-current="page">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
