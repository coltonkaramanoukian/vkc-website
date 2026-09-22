import type { ReactNode } from "react";
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
  return (
    <>
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <SiteHeader locale={locale} route={route} />
      <main id="main" data-route={route}>
        {children}
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
