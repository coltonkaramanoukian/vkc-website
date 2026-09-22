import Link from "next/link";
import { containersIn, fillMethods, type ContainerGroup } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

const GROUP_ROUTE: Record<ContainerGroup, { route: AppPathname; label: string }> = {
  "bottles-and-jugs": { route: "/containers/bottles-and-jugs", label: "bottlesAndJugs" },
  pails: { route: "/containers/pails", label: "pails" },
  kits: { route: "/containers/kits", label: "kits" },
};

/** Container families from content/containers.json — names only, no quantities. */
export async function ContainerList({
  locale,
  groups,
  linkGroups = false,
}: {
  locale: Locale;
  groups: ContainerGroup[];
  linkGroups?: boolean;
}) {
  const { t } = await getCopy(locale, "common");
  return (
    <div className={`grid gap-5 ${groups.length > 1 ? "md:grid-cols-3" : "max-w-md"}`}>
      {groups.map((group) => (
        <div key={group} className="placard">
          <h3 className="border-b-[1.5px] border-ink px-4 py-3 text-[1.25rem]">
            {linkGroups ? (
              <Link href={localizedPath(locale, GROUP_ROUTE[group].route)} className="text-ink">
                {t(`nav.${GROUP_ROUTE[group].label}`)}
              </Link>
            ) : (
              t(`nav.${GROUP_ROUTE[group].label}`)
            )}
          </h3>
          <ul className="px-4 py-3 font-mono text-[0.9375rem]">
            {containersIn(group).map((family) => (
              <li key={family.id} className="py-0.5">
                {family.name[locale]}
              </li>
            ))}
          </ul>
          {group !== "kits" && (
            <p className="border-t border-hairline px-4 py-3 text-[0.9375rem]">
              <span className="field-name mr-2">{t("fields.fillMethods")}</span>
              {fillMethods.map((m) => m.name[locale]).join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
