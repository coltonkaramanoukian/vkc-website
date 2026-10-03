// Typed access to content/articles.json — the one top-level file that holds the
// blog. Kept top-level so the number guard (reads content/*.json non-recursively)
// sees article dates as content, and so the array bundles for production. Public
// pages render ONLY published articles; a draft never leaves the editor (§1-safe:
// an unfinished post renders nothing public).

import articlesJson from "../../../content/articles.json" with { type: "json" };
import type { Localized } from "@/lib/content";
import { localizedPath, type Locale } from "@/i18n/pathnames";

export type ArticleStatus = "draft" | "published";

export interface Article {
  slug: string;
  status: ArticleStatus;
  /** YYYY-MM-DD, the display/publish date. */
  date: string;
  category: string | null;
  tags: string[];
  /** Imaging slot (Colton/Vito fill it); rendered only when set. */
  coverImage: string | null;
  title: Localized;
  excerpt: Localized;
  /** Markdown, rendered by lib/blog/markdown.tsx. */
  body: Localized;
  seo: { title: Localized; description: Localized };
}

export const allArticles: readonly Article[] = articlesJson as Article[];

/** Newest first; a stable slug tiebreak so equal dates don't reorder between renders. */
function byDateDesc(a: Article, b: Article): number {
  return a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date);
}

function hasLocale(article: Article, locale: Locale): boolean {
  const title = article.title[locale];
  const body = article.body[locale];
  return typeof title === "string" && title.trim() !== "" && typeof body === "string" && body.trim() !== "";
}

/** Published articles that have a title and body in this locale, newest first. */
export function publishedArticles(locale: Locale): Article[] {
  return allArticles
    .filter((article) => article.status === "published" && hasLocale(article, locale))
    .slice()
    .sort(byDateDesc);
}

export function articleBySlug(slug: string): Article | undefined {
  return allArticles.find((article) => article.slug === slug);
}

/** A published article renderable in this locale, or undefined (draft, missing, or locale-incomplete). */
export function publishedArticle(slug: string, locale: Locale): Article | undefined {
  const article = articleBySlug(slug);
  return article && article.status === "published" && hasLocale(article, locale) ? article : undefined;
}

/** The article's URL path for a locale, e.g. /en/blog/<slug> or /fr/blogue/<slug>. */
export function articlePath(locale: Locale, slug: string): string {
  return `${localizedPath(locale, "/blog")}/${slug}`;
}

/** A YYYY-MM-DD string formatted in the locale, in UTC so the day never drifts. */
export function formatArticleDate(date: string, locale: Locale): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
