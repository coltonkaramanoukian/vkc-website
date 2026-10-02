import type { Metadata } from "next";
import { articlePath, publishedArticle, type Article } from "@/lib/blog/articles";
import { absoluteUrl, localized, site } from "@/lib/content";
import { HREFLANG } from "@/lib/seo";
import { OG_SIZE, ogImagePath } from "@/lib/og-keys";
import { locales, type Locale } from "@/i18n/pathnames";

/** hreflang alternates for an article — only locales where it is actually published. */
export function articleAlternateLanguages(article: Article): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    if (publishedArticle(article.slug, locale)) {
      languages[HREFLANG[locale]] = absoluteUrl(articlePath(locale, article.slug));
    }
  }
  // x-default points at FR when it exists (site convention), else the first available.
  const fallback = languages[HREFLANG.fr] ?? Object.values(languages)[0];
  if (fallback) languages["x-default"] = fallback;
  return languages;
}

/** Per-article metadata: title/description/canonical/hreflang/OG/Twitter, Article is indexable. */
export function articleMetadata(locale: Locale, article: Article): Metadata {
  const title = localized(article.seo.title, locale) ?? localized(article.title, locale) ?? "";
  const description = localized(article.seo.description, locale) ?? localized(article.excerpt, locale) ?? "";
  const url = absoluteUrl(articlePath(locale, article.slug));
  const images = [{ url: ogImagePath(locale, "blog"), ...OG_SIZE, alt: title }];

  return {
    title,
    description,
    alternates: { canonical: url, languages: articleAlternateLanguages(article) },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: site.brandName,
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      alternateLocale: [locale === "fr" ? "en_CA" : "fr_CA"],
      publishedTime: article.date,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
    robots: { index: true, follow: true },
  };
}
