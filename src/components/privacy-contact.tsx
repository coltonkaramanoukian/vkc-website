import { Placard } from "@/components/placard";
import { contact, localized } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/i18n/pathnames";

/**
 * D2/D11. The privacy contact renders only from content/contact.json. While
 * `privacyOfficer` is null the block renders nothing at all — no "TBD", no
 * placeholder address.
 */
export async function PrivacyContact({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "common");
  const officer = contact.privacyOfficer;
  const fields = [
    { name: t("privacy.name"), value: officer.name },
    { name: t("privacy.role"), value: localized(officer.title, locale) },
    { name: t("contact.email"), value: officer.email },
  ].filter((row): row is { name: string; value: string } => row.value !== null);
  if (fields.length === 0) return null;
  return <Placard title={t("privacy.officer")} fields={fields} className="max-w-md" />;
}
