import type { Locale } from "@/i18n/pathnames";
import type { Client, Localized } from "./content.ts";

export interface ClientStory {
  name: string;
  logo: string | null;
  quote: { text: string; name: string; role: string | null } | null;
  caseStudy: string | null;
}

function filled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** Both languages written, or nothing: FR is written, never left for EN to cover (§3). */
function bothLanguages(value: Localized | null | undefined, locale: Locale): string | null {
  if (!value || !filled(value.en) || !filled(value.fr)) return null;
  return value[locale];
}

function quoteFor(client: Client, locale: Locale): ClientStory["quote"] {
  const quote = client.quote;
  if (!quote || !filled(quote.name)) return null;
  const text = bothLanguages(quote.text, locale);
  if (!text) return null;
  return { text, name: quote.name.trim(), role: bothLanguages(quote.role, locale) };
}

/**
 * §1: a quote or case study appears only from an approved client in
 * content/clients.json, with both languages written. Anything partial renders
 * nothing rather than half a testimonial.
 */
export function clientStories(clients: readonly Client[], locale: Locale): ClientStory[] {
  return clients
    .filter((client) => client.approved === true)
    .map((client) => ({
      name: client.name,
      logo: client.logo ?? null,
      quote: quoteFor(client, locale),
      caseStudy: bothLanguages(client.caseStudy, locale),
    }))
    .filter((story) => story.quote !== null || story.caseStudy !== null);
}
