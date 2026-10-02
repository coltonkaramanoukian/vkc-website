import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { JsonLdScript } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { articlePath, formatArticleDate, publishedArticle, publishedArticles } from "@/lib/blog/articles";
import { articleMetadata } from "@/lib/blog/article-seo";
import { Markdown } from "@/lib/blog/markdown-view";
import { absoluteUrl, localized, site } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { HREFLANG } from "@/lib/seo";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, type Crumb } from "@/lib/structured-data";
import { isLocale, locales, localizedPath } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string; slug: string }> };

// SSG the published posts; a newly published slug still resolves on demand
// (dynamicParams) until the next build regenerates the set.
export const dynamicParams = true;

export function generateStaticParams() {
  const slugs = new Set(locales.flatMap((locale) => publishedArticles(locale).map((article) => article.slug)));
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = publishedArticle(slug, locale);
  return article ? articleMetadata(locale, article) : {};
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const article = publishedArticle(slug, locale);
  if (!article) notFound(); // draft, unknown, or not written in this locale

  const { t } = await getCopy(locale);
  const title = localized(article.title, locale) ?? "";
  const body = localized(article.body, locale) ?? "";
  const url = absoluteUrl(articlePath(locale, article.slug));

  const crumbs: Crumb[] = [
    { name: t("common.home"), url: absoluteUrl(localizedPath(locale, "/")) },
    { name: t("common.nav.blog"), url: absoluteUrl(localizedPath(locale, "/blog")) },
    { name: title, url },
  ];

  return (
    <PageShell locale={locale} route="/blog">
      <article className="wrap pb-10 pt-6 sm:pt-8">
        <nav aria-label={t("common.breadcrumb")} className="breadcrumbs">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.8125rem] text-graphite">
            <li>
              <Link href={localizedPath(locale, "/")} className="chrome-link text-graphite">
                {t("common.home")}
              </Link>
            </li>
            <li aria-hidden="true"><span className="inline-block h-[3px] w-3 bg-hairline" /></li>
            <li>
              <Link href={localizedPath(locale, "/blog")} className="chrome-link text-graphite">
                {t("common.nav.blog")}
              </Link>
            </li>
            <li aria-hidden="true"><span className="inline-block h-[3px] w-3 bg-hairline" /></li>
            <li>
              <span aria-current="page" className="text-ink">{title}</span>
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-[52ch]">
          <p className="font-mono text-[0.8125rem] text-graphite">
            {t("pages.blog.published")}{" "}
            <time dateTime={article.date}>{formatArticleDate(article.date, locale)}</time>
            {article.category && <span className="ml-2 text-qc">· {article.category}</span>}
          </p>
          <h1 className="mt-4">{title}</h1>
          {localized(article.excerpt, locale) && <p className="lead mt-5">{localized(article.excerpt, locale)}</p>}
          {article.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li key={tag} className="rounded-full border border-hairline px-3 py-1 font-mono text-[0.75rem] text-graphite">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        <div className="mt-10 max-w-[64ch]">
          <Markdown markdown={body} locale={locale} />
        </div>

        <p className="mt-12">
          <Link href={localizedPath(locale, "/blog")} className="btn btn-secondary">
            ← {t("pages.blog.allPosts")}
          </Link>
        </p>
      </article>

      <JsonLdScript
        data={buildArticleJsonLd({
          headline: title,
          description: localized(article.seo.description, locale) ?? localized(article.excerpt, locale) ?? "",
          url,
          datePublished: article.date,
          inLanguage: HREFLANG[locale],
          organizationId: `${site.baseUrl}/#organization`,
        })}
      />
      <JsonLdScript data={buildBreadcrumbJsonLd(crumbs)} />
    </PageShell>
  );
}
