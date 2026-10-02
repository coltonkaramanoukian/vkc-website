import type { MetadataRoute } from "next";
import { articleAlternateLanguages } from "@/lib/blog/article-seo";
import { articlePath, publishedArticles } from "@/lib/blog/articles";
import { absoluteUrl } from "@/lib/content";
import { alternateLanguages } from "@/lib/seo";
import { locales, localizedPath, noindexRoutes, routes } from "@/i18n/pathnames";

// D10: every indexable route in both locales; the visit page is excluded. Blog
// articles are DYNAMIC (outside the fixed `routes`), so they are appended here
// explicitly — one entry per locale an article is published in, with hreflang.
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = routes
    .filter((route) => !noindexRoutes.includes(route))
    .flatMap((route) =>
      locales.map((locale) => ({
        url: absoluteUrl(localizedPath(locale, route)),
        alternates: { languages: alternateLanguages(route) },
      })),
    );

  const articles = locales.flatMap((locale) =>
    publishedArticles(locale).map((article) => ({
      url: absoluteUrl(articlePath(locale, article.slug)),
      lastModified: article.date,
      alternates: { languages: articleAlternateLanguages(article) },
    })),
  );

  return [...fixed, ...articles];
}
