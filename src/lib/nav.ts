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
    key: "containers",
    hub: "/containers",
    items: [
      { route: "/containers/bottles-and-jugs", label: "bottlesAndJugs" },
      { route: "/containers/pails", label: "pails" },
      { route: "/containers/kits", label: "kits" },
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
    key: "regions",
    items: [{ route: "/locations/montreal", label: "montreal" }],
  },
  {
    key: "company",
    items: [
      { route: "/about", label: "about" },
      { route: "/quote", label: "quote" },
      { route: "/privacy", label: "privacy" },
    ],
  },
];

/** Shown inline in the header on wide screens. */
export const primaryNav: NavItem[] = [
  { route: "/services/second-shift", label: "secondShift" },
  { route: "/services", label: "services" },
  { route: "/containers", label: "containers" },
  { route: "/industries", label: "industries" },
  { route: "/about", label: "about" },
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
