// The save boundary for blog articles. Like validate.ts for the content editor:
// nothing is trusted from the client, the canonical Article is rebuilt field by
// field, and every human-written string runs through the same staffing (§4) and
// forbidden-claims (§1) matchers the published guards use — article PAGES are
// dynamic and escape the build-time guards, so this is their only gate.

import type { Article, ArticleStatus } from "@/lib/blog/articles";
import { coerceLocalized, coerceString, constitutionProblems, type FieldError } from "./validate.ts";

export interface PreparedArticle {
  ok: boolean;
  errors: FieldError[];
  article?: Article;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function localizedProblems(path: string, value: { en: string | null; fr: string | null }, push: (e: FieldError) => void) {
  if (value.en) for (const m of constitutionProblems(value.en, ["en"])) push({ path, message: m });
  if (value.fr) for (const m of constitutionProblems(value.fr, ["fr"])) push({ path, message: m });
}

function parseTags(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw.map((t) => String(t)) : typeof raw === "string" ? raw.split(",") : [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of parts) {
    const tag = part.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
  }
  return tags;
}

function isRealDate(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

/** Validate and shape one submitted article into a canonical Article. */
export function prepareArticle(submitted: unknown): PreparedArticle {
  const data = submitted && typeof submitted === "object" ? (submitted as Record<string, unknown>) : {};
  const errors: FieldError[] = [];
  const push = (e: FieldError) => errors.push(e);

  const slug = coerceString(data.slug);
  if (!slug) push({ path: "slug", message: "A web address (slug) is required." });
  else if (!SLUG.test(slug)) push({ path: "slug", message: "Use lowercase letters, numbers and hyphens only (e.g. overflow-season)." });

  const date = coerceString(data.date);
  if (!date) push({ path: "date", message: "A date is required." });
  else if (!DATE.test(date) || !isRealDate(date)) push({ path: "date", message: "Use a real date in YYYY-MM-DD form." });

  const status: ArticleStatus = data.status === "published" ? "published" : "draft";
  const category = coerceString(data.category);
  const tags = parseTags(data.tags);
  const coverImage = coerceString(data.coverImage); // imaging passthrough (Vito's lane)

  const title = coerceLocalized(data.title);
  const excerpt = coerceLocalized(data.excerpt);
  const body = coerceLocalized(data.body);
  const seoData = data.seo && typeof data.seo === "object" ? (data.seo as Record<string, unknown>) : {};
  const seo = { title: coerceLocalized(seoData.title), description: coerceLocalized(seoData.description) };

  if (!title.en && !title.fr) push({ path: "title", message: "A title is required in at least one language." });

  localizedProblems("title", title, push);
  localizedProblems("excerpt", excerpt, push);
  localizedProblems("body", body, push);
  localizedProblems("seo.title", seo.title, push);
  localizedProblems("seo.description", seo.description, push);
  if (category) for (const m of constitutionProblems(category, ["en", "fr"])) push({ path: "category", message: m });
  for (const tag of tags) for (const m of constitutionProblems(tag, ["en", "fr"])) push({ path: "tags", message: m });

  // A published post must be renderable in at least one locale (title + body).
  const renderable = (title.en && body.en) || (title.fr && body.fr);
  if (status === "published" && !renderable) {
    push({ path: "status", message: "A published post needs both a title and a body in at least one language." });
  }

  if (errors.length > 0) return { ok: false, errors };

  const article: Article = {
    slug: slug as string,
    status,
    date: date as string,
    category,
    tags,
    coverImage,
    title,
    excerpt,
    body,
    seo,
  };
  return { ok: true, errors: [], article };
}

/** Upsert an article into the collection by slug; rename handled via originalSlug. Immutable. */
export function upsertArticle(
  list: Article[],
  article: Article,
  originalSlug?: string,
): { ok: boolean; error?: string; list?: Article[] } {
  const clash = list.some((a) => a.slug === article.slug && a.slug !== originalSlug);
  if (clash) return { ok: false, error: `Another post already uses the slug “${article.slug}”.` };

  const withoutTarget = list.filter((a) => a.slug !== article.slug && a.slug !== (originalSlug ?? article.slug));
  return { ok: true, list: [...withoutTarget, article] };
}

export function removeArticle(list: Article[], slug: string): Article[] {
  return list.filter((a) => a.slug !== slug);
}

export function setArticleStatus(list: Article[], slug: string, status: ArticleStatus): Article[] {
  return list.map((a) => (a.slug === slug ? { ...a, status } : a));
}
