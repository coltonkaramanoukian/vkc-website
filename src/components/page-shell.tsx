import type { ReactNode } from "react";
import { ActionBar } from "@/components/action-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCopy } from "@/lib/i18n";
import type { AppPathname, Locale } from "@/i18n/pathnames";

export async function PageShell({
  locale,
  route,
  children,
}: {
  locale: Locale;
  route: AppPathname;
  children: ReactNode;
}) {
  const { t } = await getCopy(locale, "common");
  // One element, not a fragment: after a client-side navigation the app
  // router scrolls the route segment's top-level nodes into view one by one
  // (footer before main before header), and where that lands depends on
  // their order and timing. With a single wrapper it scrolls one thing, and
  // the new page opens at the top every time (run 5, docs/RUN-LOG.md).
  return (
    <div data-page={route}>
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <SiteHeader locale={locale} route={route} />
      {/*
        tabIndex=-1 so activating the skip link actually MOVES focus here, not
        just scrolls. A <main> is not focusable by default: the browser's
        fragment navigation only sets the next-Tab starting point, leaving
        document.activeElement on <body> — so a screen-reader user hears
        nothing move and the focus ring vanishes for a Tab. With -1 the target
        is focusable, focus lands on the main landmark (announced), and older
        browsers that never implemented the sequential-focus starting point
        still skip the header. Load-bearing for WCAG 2.4.1; do not remove.
      */}
      <main id="main" data-route={route} tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale={locale} route={route} />
      <ActionBar locale={locale} route={route} />
    </div>
  );
}
