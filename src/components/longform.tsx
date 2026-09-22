import Link from "next/link";
import type { ReactNode } from "react";
import { CtaActions, CtaBand } from "@/components/cta-band";
import { PageShell } from "@/components/page-shell";
import { getCopy } from "@/lib/i18n";
import {
  localizedPath,
  pathnames,
  type AppPathname,
  type Locale,
} from "@/i18n/pathnames";

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

/** Inline `[label](/internal/route)` → a localized link. Plain text otherwise. */
export function Inline({ text, locale }: { text: string; locale: Locale }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, target] = match;
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const known = target in pathnames;
    parts.push(
      known ? (
        <Link key={index} href={localizedPath(locale, target as AppPathname)}>
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
 * The shared page frame for every long-form page: hero (eyebrow, h1, lead,
 * "Get a quote" + phone), then sections separated by the fill line. Sections
 * come from i18n/messages/<locale>.json → pages.<pageKey>; page-specific
 * components are passed in as named slots.
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
  const { raw } = await getCopy(locale);
  const page = raw<PageCopy>(`pages.${pageKey}`);

  return (
    <PageShell locale={locale} route={route}>
      <section className="wrap pb-10 pt-10 sm:pt-14">
        <p className="field-name">{page.eyebrow}</p>
        <h1 className="mt-3 max-w-[22ch]">{page.h1}</h1>
        <p className="mt-5 max-w-[60ch] text-[1.125rem]">
          <Inline text={page.lead} locale={locale} />
        </p>
        <div className="mt-7">
          <CtaActions locale={locale} />
        </div>
      </section>

      {hero && <div className="wrap">{hero}</div>}

      {page.sections.map((section) => (
        <section key={section.h2} className="wrap mt-14">
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

      {after}
      <CtaBand locale={locale} />
    </PageShell>
  );
}
