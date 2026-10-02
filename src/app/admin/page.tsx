import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";
import { currentArticles, currentContent, currentPricing } from "@/lib/admin/current";
import { sectionHasContent } from "@/lib/admin/prefill";
import { SECTIONS } from "@/lib/admin/sections";
import { persistenceMode } from "@/lib/admin/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NOTE: Record<string, string> = {
  fs: "Local mode — changes save to the content files on this machine.",
  github: "Live mode — saving commits to the repository, which publishes a new version of the site.",
  none: "No store configured — saving is disabled until the server is set up (see NEEDS-COLTON.md).",
};

export default async function AdminDashboard() {
  const mode = persistenceMode();
  const cards = await Promise.all(
    SECTIONS.map(async (section) => ({ section, hasContent: sectionHasContent(section, await currentContent(section)) })),
  );
  const articles = await currentArticles();
  const publishedCount = articles.filter((a) => a.status === "published").length;
  const pricing = await currentPricing();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-qc">VKC Packaging</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Content editor</h1>
        </div>
        <LogoutButton />
      </header>

      <p className="mt-6 rounded-xl border border-hairline bg-label px-4 py-3 text-sm text-graphite">{STORE_NOTE[mode]}</p>

      <ul className="mt-8 space-y-4">
        {cards.map(({ section, hasContent }) => (
          <li key={section.id}>
            <Link
              href={`/admin/${section.id}`}
              className="block rounded-2xl border border-hairline bg-label p-5 transition hover:border-qc"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                <span className={`font-mono text-xs uppercase tracking-wider ${hasContent ? "text-qc" : "text-graphite"}`}>
                  {hasContent ? "Has content" : "Empty"}
                </span>
              </div>
              <p className="mt-2 text-sm text-graphite">{section.description}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/admin/articles" className="block rounded-2xl border border-hairline bg-label p-5 transition hover:border-qc">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Blog &amp; case studies</h2>
              <span className={`font-mono text-xs uppercase tracking-wider ${articles.length > 0 ? "text-qc" : "text-graphite"}`}>
                {articles.length === 0 ? "None" : `${publishedCount} live · ${articles.length - publishedCount} draft`}
              </span>
            </div>
            <p className="mt-2 text-sm text-graphite">
              Write, edit and publish posts. Drafts stay private; published posts appear on the blog with their own page and SEO.
            </p>
          </Link>
        </li>
        <li>
          <Link href="/admin/pricing" className="block rounded-2xl border border-hairline bg-label p-5 transition hover:border-qc">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Estimator pricing</h2>
              <span className={`font-mono text-xs uppercase tracking-wider ${pricing.placeholder ? "text-graphite" : "text-qc"}`}>
                {pricing.placeholder ? "Placeholder rates" : "Live rates"}
              </span>
            </div>
            <p className="mt-2 text-sm text-graphite">
              The rates behind the public estimator at /estimate. Shown only as a ballpark range, never a fixed price.
            </p>
          </Link>
        </li>
      </ul>

      <p className="mt-10 text-xs text-graphite">
        A blank field shows nothing on the public site — there are no placeholders. Capability numbers and client names become
        facts the site stands behind, so only enter what is true and, for clients, what you have permission to show.
      </p>
    </main>
  );
}
