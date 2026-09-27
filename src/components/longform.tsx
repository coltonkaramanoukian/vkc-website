import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CtaActions, CtaBand } from "@/components/cta-band";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { RelatedPages } from "@/components/related-pages";
import { SceneCover, SceneGalleries } from "@/components/scene";
import { getCopy } from "@/lib/i18n";
import { resolveInlineHref } from "@/lib/inline-links";
import { ROUTE_PICTO } from "@/lib/related";
import { uniqueSlugs } from "@/lib/slug";
import type { AppPathname, Locale } from "@/i18n/pathnames";

export interface SectionCopy {
  h2: string;
  body?: string[];
  list?: string[];
  steps?: string[];
  split?: { heading: string; items: string[] }[];
  /** Name of a page-supplied component rendered under this section. */
  slot?: string;
}

export interface PageCopy {
  eyebrow: string;
  h1: string;
  lead: string;
  sections: SectionCopy[];
}

const LINK = /\[([^\]]+)\]\((\/[^)]*)\)/g;

/**
 * Inline `[label](/internal/route)` or `[label](/glossary#key)` → a localized
 * link (lib/inline-links.ts decides). An unknown target renders as plain text.
 */
export function Inline({ text, locale }: { text: string; locale: Locale }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, target] = match;
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const href = resolveInlineHref(locale, target);
    parts.push(
      href ? (
        <Link key={index} href={href}>
          {label}
        </Link>
      ) : (
        label
      ),
    );
    last = index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function SectionBody({ section, locale }: { section: SectionCopy; locale: Locale }) {
  return (
    <div className="prose-measure">
      {section.body?.map((p) => (
        <p key={p}>
          <Inline text={p} locale={locale} />
        </p>
      ))}
      {section.list && (
        <ul className="list-disc space-y-1.5 pl-5">
          {section.list.map((item) => (
            <li key={item}>
              <Inline text={item} locale={locale} />
            </li>
          ))}
        </ul>
      )}
      {section.steps && (
        <ol className="space-y-3">
          {section.steps.map((step) => (
            <li key={step} className="border-l-[3px] border-ink pl-4">
              <Inline text={step} locale={locale} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * The shared page frame for every long-form page: breadcrumbs, hero (eyebrow,
 * h1, lead, "Get a quote" + phone, the page's pictogram), a jump strip of the
 * page's sections, then sections separated by the fill line, related pages
 * and the CTA band. Copy comes from i18n/messages/<locale>.json →
 * pages.<pageKey>; page-specific components are passed in as named slots.
 */
export async function LongformPage({
  locale,
  route,
  pageKey,
  hero,
  slots = {},
  after,
}: {
  locale: Locale;
  route: AppPathname;
  pageKey: string;
  hero?: ReactNode;
  slots?: Record<string, ReactNode>;
  /** Rendered after the sections (e.g. a SpecGrid that is null when empty). */
  after?: ReactNode;
}) {
  const { t, raw } = await getCopy(locale);
  const page = raw<PageCopy>(`pages.${pageKey}`);
  const ids = uniqueSlugs(page.sections.map((section) => section.h2));
  const picto = ROUTE_PICTO[route];

  return (
    <PageShell locale={locale} route={route}>
      <section className="wrap pb-10 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route={route} />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-[22ch]">{page.h1}</h1>
            <p className="lead mt-5">
              <Inline text={page.lead} locale={locale} />
            </p>
            <div className="mt-7">
              <CtaActions locale={locale} />
            </div>
          </div>
          {picto && (
            <div className="hidden lg:block">
              <Pictogram name={picto} className="page-picto" />
            </div>
          )}
        </div>
      </section>

      {/* The page's cover (content/scenes.json): nothing until the slot is filled. */}
      <SceneCover route={route} locale={locale} className="wrap mb-8" />

      {page.sections.length > 2 && (
        <nav aria-label={t("common.onThisPage")} className="wrap">
          <ol className="jump-nav">
            {page.sections.map((section, index) => (
              <li key={section.h2}>
                <a href={`#${ids[index]}`}>{section.h2}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {hero && <div className="wrap mt-8">{hero}</div>}

      {page.sections.map((section, index) => (
        <section key={section.h2} id={ids[index]} className="wrap mt-14 scroll-mt-24">
          <hr className="fill-rule mb-8" />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10">
            <h2>{section.h2}</h2>
            <SectionBody section={section} locale={locale} />
          </div>
          {section.split && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {section.split.map((col) => (
                <div key={col.heading} className="placard">
                  <h3 className="border-b-[1.5px] border-ink px-4 py-3 text-[1.25rem] sm:px-5">{col.heading}</h3>
                  <ul>
                    {col.items.map((item) => (
                      <li key={item} className="placard-row px-4 py-3 sm:px-5">
                        <Inline text={item} locale={locale} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {section.slot && slots[section.slot] && <div className="mt-6">{slots[section.slot]}</div>}
        </section>
      ))}

      <SceneGalleries route={route} locale={locale} />
      {after}
      <div className="mt-14">
        <RelatedPages locale={locale} route={route} />
      </div>
      <CtaBand locale={locale} />
    </PageShell>
  );
}
