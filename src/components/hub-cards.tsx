import { Manifest, type ManifestItem } from "@/components/manifest";
import type { PictogramName } from "@/components/pictograms";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/** One linked row per page: pictogram, title, a line of copy. */
export interface HubCard {
  route: AppPathname;
  title: string;
  body?: string;
  picto: PictogramName;
}

/** A hub's pages as manifest rows (rules point somewhere; placards hold facts). */
export function HubCards({ locale, cards }: { locale: Locale; cards: HubCard[] }) {
  const items: ManifestItem[] = cards.map((card) => ({
    href: localizedPath(locale, card.route),
    title: card.title,
    body: card.body,
    picto: card.picto,
  }));
  return <Manifest items={items} />;
}
