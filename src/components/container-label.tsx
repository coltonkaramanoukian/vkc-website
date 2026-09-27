import Link from "next/link";
import { Pictogram, type PictogramName } from "@/components/pictograms";
import { containersIn, fillMethods, type ContainerGroup } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

const GROUPS: { group: ContainerGroup; route: AppPathname; label: string; picto: PictogramName }[] = [
  { group: "bottles-and-jugs", route: "/containers/bottles-and-jugs", label: "bottlesAndJugs", picto: "jug" },
  { group: "pails", route: "/containers/pails", label: "pails", picto: "pail" },
  { group: "kits", route: "/containers/kits", label: "kits", picto: "kit" },
];

/**
 * The three container groups as ONE pallet label with three fields side by
 * side, each field listing the families that have run (content/containers.json,
 * names only, no quantities) and each field a link to its page. The fill
 * methods print once, on the label's last row.
 */
export async function ContainerLabel({ locale, headingLevel = "h3" }: { locale: Locale; headingLevel?: "h3" | "span" }) {
  const { t } = await getCopy(locale, "common");
  const Title = headingLevel;
  return (
    <div className="placard">
      <div className="label-columns">
        {GROUPS.map(({ group, route, label, picto }) => (
          <Link key={group} href={localizedPath(locale, route)} className="label-col">
            <span className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
              <Title className="placard-title text-[1.375rem] font-bold leading-tight [font-stretch:112.5%]">
                {t(`nav.${label}`)}
              </Title>
              <Pictogram name={picto} />
            </span>
            <ul className="px-5 pb-5 font-mono text-[0.9375rem] leading-relaxed">
              {containersIn(group).map((family) => (
                <li key={family.id}>{family.name[locale]}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
      <p className="border-t border-hairline px-5 py-3 text-[0.9375rem]">
        <span className="field-name mr-3">{t("fields.fillMethods")}</span>
        {fillMethods.map((m) => m.name[locale]).join(", ")}
      </p>
    </div>
  );
}
