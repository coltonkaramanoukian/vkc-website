"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The site menu: a <details> element, so it opens and closes without
 * JavaScript. This wrapper only adds what a keyboard user expects on top:
 * Escape closes it, a click outside closes it, and following a link closes it.
 */
export function NavMenu({
  label,
  panel,
  className = "",
}: {
  label: string;
  panel: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const close = () => details.removeAttribute("open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) {
        close();
        details.querySelector("summary")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (details.open && event.target instanceof Node && !details.contains(event.target)) close();
    };
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    details.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      details.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <details ref={ref} className={`menu ${className}`}>
      <summary className="menu-summary" aria-haspopup="true">
        <span className="menu-glyph" aria-hidden="true" />
        {label}
      </summary>
      {panel}
    </details>
  );
}
