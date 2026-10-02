import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/article-form";
import { articleToForm } from "@/lib/admin/article-form-state";
import { currentArticles } from "@/lib/admin/current";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ArticleEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isNew = slug === "new";
  const articles = await currentArticles();
  const article = isNew ? null : articles.find((a) => a.slug === slug) ?? null;
  if (!isNew && !article) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav className="mb-6">
        <Link href="/admin/articles" className="font-mono text-xs uppercase tracking-wider text-graphite transition hover:text-ink">
          ← All posts
        </Link>
      </nav>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">{isNew ? "New post" : "Edit post"}</h1>
        <p className="mt-2 text-sm text-graphite">
          A draft stays invisible on the public site. Writing refuses staffing wording and claims the site can’t make, the same as the rest of the editor.
        </p>
      </header>
      <ArticleForm initial={articleToForm(article, today)} originalSlug={article?.slug ?? null} coverImage={article?.coverImage ?? null} />
    </main>
  );
}
