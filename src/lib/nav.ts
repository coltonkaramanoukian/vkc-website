import type { AppPathname } from "@/i18n/pathnames";

export interface NavItem {
  route: AppPathname;
  /** key under common.nav */
  label: string;
}

export interface NavGroup {
  /** key under common.groups */
  key: string;
  /** The group's hub page, when it has one. */
  hub?: AppPathname;
  items: NavItem[];
}

/**
 * The site's order, everywhere it is listed (menu, footer, primary nav):
 * Services (Second Shift, then the two Bottleneck pages), Industries,
 * Containers, Regions, then the company pages with Contact before the
 * rest. Colton's brief of 2026-09-27; the labels and slugs did not change.
 */
export const navGroups: NavGroup[] = [
  {
    key: "services",
    hub: "/services",
    items: [
      { route: "/services/second-shift", label: "secondShift" },
      { route: "/services/contract-packaging", label: "contractPackaging" },
      { route: "/services/toll-blending", label: "tollBlending" },
    ],
  },
  {
    key: "industries",
    hub: "/industries",
    items: [
      { route: "/industries/cleaners", label: "cleaners" },
      { route: "/industries/lubricants", label: "lubricants" },
      { route: "/industries/sealers-and-coatings", label: "sealersCoatings" },
    ],
  },
  {
    key: "containers",
    hub: "/containers",
    items: [
      { route: "/containers/bottles-and-jugs", label: "bottlesAndJugs" },
      { route: "/containers/pails", label: "pails" },
      { route: "/containers/kits", label: "kits" },
    ],
  },
  {
    key: "regions",
    items: [{ route: "/locations/montreal", label: "montreal" }],
  },
  {
    key: "company",
    items: [
      { route: "/about", label: "about" },
      { route: "/contact", label: "contact" },
      { route: "/quote", label: "quote" },
      { route: "/blog", label: "blog" },
      { route: "/glossary", label: "glossary" },
      { route: "/privacy", label: "privacy" },
    ],
  },
];

/**
 * Shown inline in the header from xl, in the site's order. Five of the six
 * groups: with Montréal the French row plus the French quote button
 * overflow the 72rem column by 58px at every width (measured 2026-09-27),
 * and the labels are not for shrinking. Regions keeps its place in the
 * menu, the footer and the home page's closing cells.
 */
export const primaryNav: NavItem[] = [
  { route: "/services", label: "services" },
  { route: "/industries", label: "industries" },
  { route: "/containers", label: "containers" },
  { route: "/about", label: "about" },
  { route: "/contact", label: "contact" },
];

/** The group a route belongs to, if any. */
export function groupOf(route: AppPathname): NavGroup | undefined {
  return navGroups.find((group) => group.hub === route || group.items.some((item) => item.route === route));
}

/** The common.nav key for a route, falling back to the hub's group key. */
export function navLabelKey(route: AppPathname): string | undefined {
  for (const group of navGroups) {
    if (group.hub === route) return group.key;
    const item = group.items.find((i) => i.route === route);
    if (item) return item.label;
  }
  return undefined;
}

/** /containers/bottles-and-jugs → bottlesAndJugs (the pages.* key). */
export function pageKeyFor(route: AppPathname): string {
  const last = route.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
}
