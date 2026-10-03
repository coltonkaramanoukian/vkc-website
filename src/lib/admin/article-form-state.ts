// The editor's form shape, derived from an Article (or blank for a new post).
// Plain module so the server editor page and the client form can both import it.

import type { Article } from "@/lib/blog/articles";

export type Pair = { en: string; fr: string };

export interface ArticleFormState {
  slug: string;
  status: "draft" | "published";
  date: string;
  category: string;
  tags: string;
  title: Pair;
  excerpt: Pair;
  body: Pair;
  seoTitle: Pair;
  seoDescription: Pair;
}

function pair(value: { en: string | null; fr: string | null } | undefined): Pair {
  return { en: value?.en ?? "", fr: value?.fr ?? "" };
}

export function articleToForm(article: Article | null, today: string): ArticleFormState {
  if (!article) {
    return {
      slug: "",
      status: "draft",
      date: today,
      category: "",
      tags: "",
      title: { en: "", fr: "" },
      excerpt: { en: "", fr: "" },
      body: { en: "", fr: "" },
      seoTitle: { en: "", fr: "" },
      seoDescription: { en: "", fr: "" },
    };
  }
  return {
    slug: article.slug,
    status: article.status,
    date: article.date,
    category: article.category ?? "",
    tags: article.tags.join(", "),
    title: pair(article.title),
    excerpt: pair(article.excerpt),
    body: pair(article.body),
    seoTitle: pair(article.seo.title),
    seoDescription: pair(article.seo.description),
  };
}
