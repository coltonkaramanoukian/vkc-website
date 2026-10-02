"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SaveBar, useSave } from "@/components/admin/save-bar";
import type { ArticleFormState } from "@/lib/admin/article-form-state";

const INPUT = "w-full rounded-lg border border-hairline bg-floor px-3 py-2 text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-qc placeholder:text-graphite/60";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block font-mono text-xs uppercase tracking-wider text-graphite">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs text-qc">
      {message}
    </p>
  ) : null;
}

export function ArticleForm({ initial, originalSlug, coverImage }: { initial: ArticleFormState; originalSlug: string | null; coverImage: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState<ArticleFormState>(initial);
  const { status: saveStatus, bannerError, fieldErrors, save } = useSave();
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setPair(key: "title" | "excerpt" | "body" | "seoTitle" | "seoDescription", locale: "en" | "fr", value: string) {
    setForm((current) => ({ ...current, [key]: { ...current[key], [locale]: value } }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const article = {
      slug: form.slug,
      status: form.status,
      date: form.date,
      category: form.category,
      tags: form.tags,
      coverImage, // imaging passthrough — never set in this form
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      seo: { title: form.seoTitle, description: form.seoDescription },
    };
    const ok = await save({ article, originalSlug }, "/api/admin/articles/save");
    if (ok) {
      router.push("/admin/articles");
      router.refresh();
    }
  }

  async function onDelete() {
    if (!originalSlug || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/admin/articles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: originalSlug }),
      });
      if (response.ok) {
        router.push("/admin/articles");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const localizedBlock = (
    key: "title" | "excerpt" | "body" | "seoTitle" | "seoDescription",
    label: string,
    hint: string | undefined,
    rows: number,
  ) => (
    <div className="space-y-2">
      <span className="block font-mono text-xs uppercase tracking-wider text-graphite">{label}</span>
      <div className={rows > 1 ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        {(["en", "fr"] as const).map((loc) => {
          const id = `${key}-${loc}`;
          const common = { id, value: form[key][loc], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPair(key, loc, e.target.value), className: INPUT, "aria-label": `${label} (${loc.toUpperCase()})` };
          return (
            <div key={loc}>
              <label htmlFor={id} className="mb-1 block text-xs text-graphite">
                {loc === "en" ? "English" : "Français"}
              </label>
              {rows > 1 ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}
            </div>
          );
        })}
      </div>
      {hint && <p className="text-xs text-graphite">{hint}</p>}
      <FieldError message={fieldErrors.get(key === "seoTitle" ? "seo.title" : key === "seoDescription" ? "seo.description" : key)} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="slug">Web address (slug)</Label>
          <input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="overflow-season" className={INPUT} />
          <p className="text-xs text-graphite">The post lives at /blog/&lt;slug&gt;. Lowercase, hyphens.</p>
          <FieldError message={fieldErrors.get("slug")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date">Date</Label>
          <input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={INPUT} />
          <FieldError message={fieldErrors.get("date")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <input id="category" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="case-study, guide, news…" className={INPUT} />
          <FieldError message={fieldErrors.get("category")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tags">Tags</Label>
          <input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="comma, separated" className={INPUT} />
          <FieldError message={fieldErrors.get("tags")} />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <div className="flex gap-2">
          {(["draft", "published"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => set("status", value)}
              aria-pressed={form.status === value}
              className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${form.status === value ? "border-qc bg-qc text-on-qc" : "border-hairline text-graphite hover:text-ink"}`}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="text-xs text-graphite">A draft never appears on the public site. Published posts show on the blog and get their own page.</p>
        <FieldError message={fieldErrors.get("status")} />
      </fieldset>

      {localizedBlock("title", "Title", undefined, 1)}
      {localizedBlock("excerpt", "Excerpt", "Shown on the blog index and as the search/social description. One or two sentences.", 2)}
      {localizedBlock("body", "Body (Markdown)", "## heading, ### subheading, **bold**, *italic*, `code`, - bullet, 1. numbered, > quote, [label](/services) link.", 12)}

      <details className="rounded-xl border border-hairline p-4">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-graphite">SEO overrides (optional)</summary>
        <div className="mt-4 space-y-5">
          {localizedBlock("seoTitle", "SEO title", "Defaults to the post title if left blank.", 1)}
          {localizedBlock("seoDescription", "SEO description", "Defaults to the excerpt if left blank.", 2)}
        </div>
      </details>

      <SaveBar status={saveStatus} bannerError={bannerError} />

      {originalSlug && (
        <div className="border-t border-hairline pt-6">
          <button type="button" onClick={onDelete} disabled={deleting} className="text-sm text-graphite underline transition hover:text-qc disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete this post"}
          </button>
        </div>
      )}
    </form>
  );
}
