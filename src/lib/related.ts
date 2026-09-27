import type { PictogramName } from "@/components/pictograms";
import type { AppPathname } from "@/i18n/pathnames";

/** The pictogram that stands for each page, in cards and page heads. */
export const ROUTE_PICTO: Partial<Record<AppPathname, PictogramName>> = {
  "/services": "facility",
  "/services/second-shift": "plant",
  "/services/contract-packaging": "facility",
  "/services/toll-blending": "blend",
  "/containers": "bottle",
  "/containers/bottles-and-jugs": "jug",
  "/containers/pails": "pail",
  "/containers/kits": "kit",
  "/industries": "roller",
  "/industries/cleaners": "spray",
  "/industries/lubricants": "oilcan",
  "/industries/sealers-and-coatings": "roller",
  "/locations/montreal": "plant",
  "/about": "clipboard",
  "/contact": "phone",
  "/glossary": "tag",
  "/quote": "clipboard",
};

/**
 * "Keep reading": three pages that follow naturally from each one. Chosen by
 * hand so a container page points at the trades that use it and the service
 * that fills it, not at more containers.
 */
export const RELATED: Partial<Record<AppPathname, AppPathname[]>> = {
  "/services": ["/services/second-shift", "/services/contract-packaging", "/services/toll-blending"],
  "/services/second-shift": ["/locations/montreal", "/industries", "/about"],
  "/services/contract-packaging": ["/containers", "/services/toll-blending", "/industries"],
  "/services/toll-blending": ["/services/contract-packaging", "/industries/sealers-and-coatings", "/containers/pails"],
  "/containers": ["/services/contract-packaging", "/industries", "/services/toll-blending"],
  "/containers/bottles-and-jugs": ["/industries/cleaners", "/industries/lubricants", "/containers/kits"],
  "/containers/pails": ["/industries/sealers-and-coatings", "/industries/lubricants", "/services/toll-blending"],
  "/containers/kits": ["/containers/bottles-and-jugs", "/industries/sealers-and-coatings", "/services/contract-packaging"],
  // No Second Shift card here: the hub carries no Second Shift placard, and
  // naming the service in main without the four facts fails the guard (§4).
  "/industries": ["/containers", "/services/contract-packaging", "/services/toll-blending"],
  "/industries/cleaners": ["/containers/bottles-and-jugs", "/services/toll-blending", "/services/second-shift"],
  "/industries/lubricants": ["/containers/pails", "/containers/bottles-and-jugs", "/services/second-shift"],
  "/industries/sealers-and-coatings": ["/containers/pails", "/containers/kits", "/services/toll-blending"],
  "/locations/montreal": ["/services/second-shift", "/services/contract-packaging", "/about"],
  "/about": ["/services", "/industries", "/contact"],
  "/contact": ["/quote", "/about", "/services"],
  "/glossary": ["/services", "/containers", "/about"],
  "/privacy": ["/about", "/services", "/containers"],
};
