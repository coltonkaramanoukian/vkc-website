import { clientsForDisplay } from "@/lib/content";
import { clientStories } from "@/lib/client-stories";
import { SHOW_PLACEHOLDERS } from "@/lib/scenes";
import type { Locale } from "@/i18n/pathnames";

/** Preview only: what each empty slot is waiting for, never a made-up quote (§1). */
const SLOTS = [
  "CLIENT QUOTE: a named person's words, with the client's written yes (content/clients.json quote)",
  "CASE STUDY: what VKC ran for an approved client, in FR and EN (content/clients.json caseStudy)",
];

/** FR quotes take guillemets with non-breaking spaces; EN takes curly quotes. */
function quoted(text: string, locale: Locale): string {
  return locale === "fr" ? `«\u00a0${text}\u00a0»` : `“${text}”`;
}

/**
 * Quotes and case studies from approved clients. With none, the section does
 * not exist; on a placeholder build it shows labelled slots instead.
 */
export function ClientStories({ locale, heading }: { locale: Locale; heading: string }) {
  const stories = clientStories(clientsForDisplay(), locale);
  if (stories.length === 0 && !SHOW_PLACEHOLDERS) return null;

  return (
    <section className="wrap section-tight" aria-labelledby="stories-heading">
      <h2 id="stories-heading">{heading}</h2>
      {stories.length === 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {SLOTS.map((slot) => (
            <div key={slot} className="vkc-photo-placeholder" data-story-slot>
              {slot}
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {stories.map((story) => (
            <li key={story.name} className="placard flex flex-col gap-5 p-5 sm:p-6">
              {story.quote ? (
                <figure>
                  <blockquote className="text-[1.25rem] leading-snug">
                    <p>{quoted(story.quote.text, locale)}</p>
                  </blockquote>
                  <figcaption className="mt-4 text-graphite">
                    <span className="font-semibold text-ink">{story.quote.name}</span>
                    {story.quote.role ? `, ${story.quote.role}` : null}
                    {`, ${story.name}`}
                  </figcaption>
                </figure>
              ) : null}
              {story.caseStudy ? (
                <div className={story.quote ? "border-t border-hairline pt-5" : undefined}>
                  {story.quote ? null : <h3 className="text-[1.375rem]">{story.name}</h3>}
                  <p className={story.quote ? undefined : "mt-3"}>{story.caseStudy}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
