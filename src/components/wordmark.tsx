import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "./wordmark-data";

/** Outlined wordmark from brand/wordmark.svg. Decorative: the link carries the name. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {WORDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
