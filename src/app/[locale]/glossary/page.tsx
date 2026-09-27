import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CtaActions, CtaBand } from "@/components/cta-band";
import { Glossary, type GlossaryTerm } from "@/components/glossary";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { RelatedPages } from "@/components/related-pages";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/glossary", "glossary");
}

/**
 * The trade's words, defined. No facts about VKC beyond the two service
 * definitions (which carry the four Second Shift facts, §4), no numbers.
 */
export default async function GlossaryPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const terms = raw<GlossaryTerm[]>("pages.glossary.terms");

  return (
    <PageShell locale={locale} route="/glossary">
      <section className="wrap pb-10 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route="/glossary" />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{t("pages.glossary.eyebrow")}</p>
            <h1 className="mt-4 max-w-[22ch]">{t("pages.glossary.h1")}</h1>
            <p className="lead mt-5">{t("pages.glossary.lead")}</p>
            <div className="mt-7">
              <CtaActions locale={locale} />
            </div>
          </div>
          <div className="hidden lg:block">
            <Pictogram name="tag" className="page-picto" />
          </div>
        </div>
      </section>

      <Glossary locale={locale} terms={terms} title={t("meta.glossary.title")} />

      <div className="mt-14">
        <RelatedPages locale={locale} route="/glossary" />
      </div>
      <CtaBand locale={locale} />
    </PageShell>
  );
}
