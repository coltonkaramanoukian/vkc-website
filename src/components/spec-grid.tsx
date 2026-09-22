import { Placard } from "@/components/placard";
import { localized, type Localized } from "@/lib/content";
import type { Locale } from "@/i18n/pathnames";

export interface SpecRow {
  label: string;
  value: Localized;
}

/**
 * D5. Capability facts render ONLY from content/capabilities.json. Rows with a
 * null value are dropped; with no values at all, nothing renders.
 */
export function SpecGrid({
  locale,
  title,
  rows,
}: {
  locale: Locale;
  title: string;
  rows: SpecRow[];
}) {
  const present = rows
    .map((row) => ({ name: row.label, value: localized(row.value, locale) }))
    .filter((row): row is { name: string; value: string } => row.value !== null);
  if (present.length === 0) return null;
  return <Placard title={title} headingLevel="h2" fields={present} />;
}
