import { QuoteForm, type FormSource, type QuoteFormLabels } from "@/components/quote-form";
import { contact, containerFamilies } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/i18n/pathnames";

/**
 * Server wrapper: resolves only the form's strings and the container list, so
 * the client bundle never carries the whole message catalogue.
 */
export async function QuoteFormSection({ locale, mode, source }: { locale: Locale; mode: "full" | "short"; source?: FormSource }) {
  const { raw } = await getCopy(locale);
  const labels = raw<QuoteFormLabels>("form");
  const containers = containerFamilies.map((family) => ({
    id: family.id,
    name: family.name[locale],
  }));
  return (
    <QuoteForm
      mode={mode}
      source={source}
      locale={locale}
      labels={labels}
      containers={containers}
      phone={contact.phone}
      privacyHref={localizedPath(locale, "/privacy")}
    />
  );
}
