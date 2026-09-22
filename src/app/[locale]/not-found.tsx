import Link from "next/link";
import { getLocale } from "next-intl/server";
import { PageShell } from "@/components/page-shell";
import { getCopy } from "@/lib/i18n";
import { isLocale, localizedPath, type Locale } from "@/i18n/pathnames";

export default async function LocaleNotFound() {
  const current = await getLocale();
  const locale: Locale = isLocale(current) ? current : "fr";
  const { t } = await getCopy(locale);
  return (
    <PageShell locale={locale} route="/">
      <section className="wrap py-16">
        <h1>{t("notFound.heading")}</h1>
        <p className="mt-4">{t("notFound.body")}</p>
        <p className="mt-6">
          <Link href={localizedPath(locale, "/")}>{t("notFound.home")}</Link>
        </p>
      </section>
    </PageShell>
  );
}
