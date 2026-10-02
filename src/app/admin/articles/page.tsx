import Link from "next/link";
import { ArticleRowActions } from "@/components/admin/article-row-actions";
import { currentArticles } from "@/lib/admin/current";
import { persistenceMode } from "@/lib/admin/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NOTE: Record<string, string> = {
  fs: "Local mode — saving writes the articles file on this machine.",
  github: "Live mode — saving commits to the repository and publishes a new version of the site.",
  none: "No store configured — saving is disabled until the server is set up (see NEEDS-COLTON.md §11).",
};

export default async function AdminArticlesPage() {
  const mode = persistenceMode();
  const articles = (await currentArticles())
    .slice()
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-graphite transition hover:text-ink">
            ← All sections
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Blog &amp; case studies</h1>
        </div>
        <Link href="/admin/articles/new" className="rounded-lg bg-qc px-4 py-2 text-sm font-medium text-on-qc transition hover:opacity-90">
          New post
        </Link>
      </header>

      <p className="mt-6 rounded-xl border border-hairline bg-label px-4 py-3 text-sm text-graphite">{STORE_NOTE[mode]}</p>

      {articles.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-hairline px-4 py-10 text-center text-sm text-graphite">
          No posts yet. Create one — it stays a draft until you publish it.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-label">
          {articles.map((article) => (
            <li key={article.slug} className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[0.7rem] uppercase tracking-wider ${article.status === "published" ? "text-qc" : "text-graphite"}`}>
                    {article.status}
                  </span>
                  <span className="font-mono text-[0.7rem] text-graphite">{article.date}</span>
                </div>
                <p className="mt-1 truncate text-ink">{article.title.en || article.title.fr || article.slug}</p>
                <p className="truncate font-mono text-xs text-graphite">/{article.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ArticleRowActions slug={article.slug} status={article.status} />
                <Link href={`/admin/articles/${article.slug}`} className="rounded-md border border-hairline px-3 py-1 text-xs text-ink transition hover:border-qc">
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
