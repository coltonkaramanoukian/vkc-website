"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SaveBar, useSave } from "@/components/admin/save-bar";
import type { Testimonial } from "@/lib/testimonials/testimonials";

const INPUT =
  "w-full rounded-lg border border-hairline bg-floor px-3 py-2 text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-qc placeholder:text-graphite/60";
const SMALL = "font-mono text-xs uppercase tracking-wider text-graphite";

let counter = 0;
const uid = () => `t-${counter++}`;

type Loc = { en: string; fr: string };
interface Row {
  _key: string;
  id: string;
  published: boolean;
  quote: Loc;
  author: string;
  company: string;
  role: Loc;
  date: string;
  rating: string;
}

const loc = (value: { en: string | null; fr: string | null } | undefined): Loc => ({
  en: value?.en ?? "",
  fr: value?.fr ?? "",
});

const toRow = (t: Testimonial): Row => ({
  _key: uid(),
  id: t.id,
  published: t.published,
  quote: loc(t.quote),
  author: t.author,
  company: t.company ?? "",
  role: loc(t.role),
  date: t.date ?? "",
  rating: t.rating === null || t.rating === undefined ? "" : String(t.rating),
});

const emptyRow = (): Row => ({
  _key: uid(),
  id: "",
  published: false,
  quote: { en: "", fr: "" },
  author: "",
  company: "",
  role: { en: "", fr: "" },
  date: "",
  rating: "",
});

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs text-qc">
      {message}
    </p>
  ) : null;
}

export function TestimonialsForm({ initial }: { initial: Testimonial[] }) {
  const router = useRouter();
  const { status, bannerError, fieldErrors, save } = useSave();
  const [rows, setRows] = useState<Row[]>(initial.length > 0 ? initial.map(toRow) : [emptyRow()]);

  const err = (index: number, path: string) => fieldErrors.get(`${index}:${path}`);

  function patch(key: string, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...p } : r)));
  }
  function patchLoc(key: string, field: "quote" | "role", lang: "en" | "fr", value: string) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [field]: { ...r[field], [lang]: value } } : r)));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const testimonials = rows.map((r) => ({
      id: r.id,
      published: r.published,
      quote: r.quote,
      author: r.author,
      company: r.company,
      role: r.role,
      date: r.date,
      rating: r.rating,
    }));
    const ok = await save({ testimonials }, "/api/admin/testimonials/save");
    if (ok) router.refresh();
  }

  const localizedBlock = (row: Row, index: number, field: "quote" | "role", label: string, rows_: number) => (
    <div>
      <span className={SMALL}>{label}</span>
      <div className={`mt-1 grid gap-2 ${rows_ > 1 ? "" : "sm:grid-cols-2"}`}>
        {(["en", "fr"] as const).map((lang) => {
          const common = {
            value: row[field][lang],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => patchLoc(row._key, field, lang, e.target.value),
            className: INPUT,
            placeholder: lang === "en" ? "English" : "Français",
            "aria-label": `${label} (${lang.toUpperCase()})`,
          };
          return rows_ > 1 ? <textarea key={lang} rows={rows_} {...common} /> : <input key={lang} type="text" {...common} />;
        })}
      </div>
      <FieldError message={err(index, field)} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {rows.map((row, index) => (
        <section key={row._key} className="space-y-4 rounded-2xl border border-hairline bg-label p-5">
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" checked={row.published} onChange={(e) => patch(row._key, { published: e.target.checked })} className="size-5 accent-qc" />
              {row.published ? "Published" : "Unpublished (hidden)"}
            </label>
            <button type="button" onClick={() => setRows((rs) => rs.filter((r) => r._key !== row._key))} className="text-sm text-graphite underline transition hover:text-qc">
              Remove this testimonial
            </button>
          </div>
          <FieldError message={err(index, "published")} />

          {localizedBlock(row, index, "quote", "Quote", 3)}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={SMALL}>Author (name)</span>
              <input aria-label="Author (name)" value={row.author} onChange={(e) => patch(row._key, { author: e.target.value })} placeholder="Jane Tremblay" className={`${INPUT} mt-1`} />
              <FieldError message={err(index, "author")} />
            </div>
            <div>
              <span className={SMALL}>Company (optional)</span>
              <input aria-label="Company (optional)" value={row.company} onChange={(e) => patch(row._key, { company: e.target.value })} className={`${INPUT} mt-1`} />
              <FieldError message={err(index, "company")} />
            </div>
          </div>

          {localizedBlock(row, index, "role", "Role (optional)", 1)}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className={SMALL}>Date (optional)</span>
              <input aria-label="Date (optional)" type="date" value={row.date} onChange={(e) => patch(row._key, { date: e.target.value })} className={`${INPUT} mt-1`} />
              <FieldError message={err(index, "date")} />
            </div>
            <div>
              <span className={SMALL}>Rating (optional)</span>
              <select aria-label="Rating (optional)" value={row.rating} onChange={(e) => patch(row._key, { rating: e.target.value })} className={`${INPUT} mt-1`}>
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <FieldError message={err(index, "rating")} />
            </div>
            <div>
              <span className={SMALL}>Id (optional)</span>
              <input aria-label="Id (optional)" value={row.id} onChange={(e) => patch(row._key, { id: e.target.value })} placeholder="auto" className={`${INPUT} mt-1`} />
              <FieldError message={err(index, "id")} />
            </div>
          </div>
        </section>
      ))}

      <button type="button" onClick={() => setRows((rs) => [...rs, emptyRow()])} className="rounded-lg border border-hairline px-4 py-2 text-sm text-ink transition hover:border-qc">
        Add testimonial
      </button>

      <SaveBar status={status} bannerError={bannerError} />
    </form>
  );
}
