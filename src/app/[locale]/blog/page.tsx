import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CtaBand } from "@/components/cta-band";
import { JsonLdScript } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { articlePath, formatArticleDate, publishedArticles } from "@/lib/blog/articles";
import { absoluteUrl, localized } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale, localizedPath, type Locale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/blog", "blog");
}

/** A Blog node listing the published posts, so search sees the index as a feed. */
function blogListJsonLd(locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    url: absoluteUrl(localizedPath(locale, "/blog")),
    blogPost: publishedArticles(locale).map((article) => ({
      "@type": "BlogPosting",
      headline: localized(article.title, locale),
      url: absoluteUrl(articlePath(locale, article.slug)),
      datePublished: article.date,
    })),
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t } = await getCopy(locale);
  const articles = publishedArticles(locale);

  return (
    <PageShell locale={locale} route="/blog">
      <section className="wrap pb-10 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route="/blog" />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{t("pages.blog.eyebrow")}</p>
            <h1 className="mt-4 max-w-[22ch]">{t("pages.blog.h1")}</h1>
            <p className="lead mt-5">{t("pages.blog.lead")}</p>
          </div>
          <div className="hidden lg:block">
            <Pictogram name="clipboard" className="page-picto" />
          </div>
        </div>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      <section className="wrap pt-10">
        {articles.length === 0 ? (
          <div className="placard max-w-[52ch] p-6 sm:p-8">
            <h2 className="text-[1.5rem]">{t("pages.blog.emptyTitle")}</h2>
            <p className="mt-3 text-graphite">{t("pages.blog.emptyBody")}</p>
          </div>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-[var(--vkc-radius)] border border-hairline bg-hairline sm:grid-cols-2">
            {articles.map((article) => (
              <li key={article.slug} className="bg-floor">
                <Link href={articlePath(locale, article.slug)} className="group block h-full p-6 transition-colors hover:bg-label sm:p-7">
                  <p className="font-mono text-[0.8125rem] text-graphite">
                    <time dateTime={article.date}>{formatArticleDate(article.date, locale)}</time>
                    {article.category && <span className="ml-2 text-qc">· {article.category}</span>}
                  </p>
                  <h2 className="mt-3 text-[1.35rem] leading-snug text-ink group-hover:underline">{localized(article.title, locale)}</h2>
                  {localized(article.excerpt, locale) && <p className="mt-2 text-graphite">{localized(article.excerpt, locale)}</p>}
                  <p className="mt-4 font-mono text-[0.8125rem] text-qc">{t("pages.blog.readMore")} →</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CtaBand locale={locale} />
      {articles.length > 0 && <JsonLdScript data={blogListJsonLd(locale)} />}
    </PageShell>
  );
}
