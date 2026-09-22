import type { AppPathname } from "@/i18n/pathnames";

export interface NavItem {
  route: AppPathname;
  /** key under common.nav */
  label: string;
}

export interface NavGroup {
  /** key under common.groups */
  key: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    key: "services",
    items: [
      { route: "/services/second-shift", label: "secondShift" },
      { route: "/services/contract-packaging", label: "contractPackaging" },
      { route: "/services/toll-blending", label: "tollBlending" },
    ],
  },
  {
    key: "containers",
    items: [
      { route: "/containers/bottles-and-jugs", label: "bottlesAndJugs" },
      { route: "/containers/pails", label: "pails" },
      { route: "/containers/kits", label: "kits" },
    ],
  },
  {
    key: "industries",
    items: [
      { route: "/industries/cleaners", label: "cleaners" },
      { route: "/industries/lubricants", label: "lubricants" },
      { route: "/industries/sealers-and-coatings", label: "sealersCoatings" },
    ],
  },
  {
    key: "regions",
    items: [
      { route: "/locations/montreal", label: "montreal" },
    ],
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
  { route: "/services/contract-packaging", label: "contractPackaging" },
  { route: "/services/toll-blending", label: "tollBlending" },
  { route: "/about", label: "about" },
];
