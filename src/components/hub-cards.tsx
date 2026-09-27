import Link from "next/link";
import { Pictogram, type PictogramName } from "@/components/pictograms";
import { containersIn, fillMethods, type ContainerGroup } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

/** One linked label per card: pictogram, title, a line of copy. */
export interface HubCard {
  route: AppPathname;
  title: string;
  body?: string;
  picto: PictogramName;
}

export function HubCards({ locale, cards }: { locale: Locale; cards: HubCard[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => (
        <li key={card.route}>
          <Link href={localizedPath(locale, card.route)} className="placard placard-link flex h-full flex-col p-5">
            <Pictogram name={card.picto} />
            <span className="placard-title mt-5 block text-[1.375rem] font-bold leading-tight [font-stretch:112.5%]">
              {card.title}
            </span>
            {card.body && <span className="mt-2 block text-graphite">{card.body}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const GROUPS: { group: ContainerGroup; route: AppPathname; label: string; picto: PictogramName }[] = [
  { group: "bottles-and-jugs", route: "/containers/bottles-and-jugs", label: "bottlesAndJugs", picto: "jug" },
  { group: "pails", route: "/containers/pails", label: "pails", picto: "pail" },
  { group: "kits", route: "/containers/kits", label: "kits", picto: "kit" },
];

/** The three container groups as linked labels listing their families. */
export async function ContainerGroupCards({ locale }: { locale: Locale }) {
  const { t } = await getCopy(locale, "common");
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {GROUPS.map(({ group, route, label, picto }) => (
        <li key={group}>
          <Link href={localizedPath(locale, route)} className="placard placard-link flex h-full flex-col">
            <span className="flex items-start justify-between gap-4 border-b-[1.5px] border-ink px-5 py-4">
              <span className="placard-title text-[1.375rem] font-bold leading-tight [font-stretch:112.5%]">
                {t(`nav.${label}`)}
              </span>
              <Pictogram name={picto} />
            </span>
            <ul className="px-5 py-4 font-mono text-[0.9375rem] leading-relaxed">
              {containersIn(group).map((family) => (
                <li key={family.id}>{family.name[locale]}</li>
              ))}
            </ul>
            {group !== "kits" && (
              <span className="mt-auto block border-t border-hairline px-5 py-3 text-[0.9375rem]">
                <span className="field-name mr-2">{t("fields.fillMethods")}</span>
                {fillMethods.map((m) => m.name[locale]).join(", ")}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
