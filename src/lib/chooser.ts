// "Which one fits?" — two questions on the home page that point a reader at
// one of the two services, or at a walkthrough. Pure: no facts, no numbers,
// only the shape of the decision the site already describes in prose.

import type { AppPathname } from "@/i18n/pathnames";

export const PRESSURES = ["shifts", "line", "blend"] as const;
export const WANTS = ["ownLine", "delivered", "unsure"] as const;

export type Pressure = (typeof PRESSURES)[number];
export type Want = (typeof WANTS)[number];
export type Recommendation = "secondShift" | "bottleneck" | "tollBlending" | "walkthrough";

export const RESULT_ROUTE: Record<Recommendation, AppPathname> = {
  secondShift: "/services/second-shift",
  bottleneck: "/services/contract-packaging",
  tollBlending: "/services/toll-blending",
  walkthrough: "/quote",
};

export function recommend(pressure: Pressure | null, want: Want | null): Recommendation | null {
  if (!pressure || !want) return null;
  // A product that is not made yet needs the blend before anything else.
  if (pressure === "blend") return "tollBlending";
  if (pressure === "shifts") return want === "delivered" ? "bottleneck" : "secondShift";
  // The line is full: output off that same line is a contradiction worth a look.
  return want === "ownLine" ? "walkthrough" : "bottleneck";
}
