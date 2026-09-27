// Pictograms in the manner of a pallet label's handling marks: hairline
// drawings, one stroke weight, no fill. Decorative — every one is aria-hidden
// and the text beside it carries the meaning. Drawn here by hand; nothing is
// stock, generated or third-party (§1).

import type { SVGProps } from "react";

export type PictogramName =
  | "bottle"
  | "jug"
  | "pail"
  | "kit"
  | "spray"
  | "oilcan"
  | "roller"
  | "clipboard"
  | "plant"
  | "facility"
  | "blend"
  | "phone"
  | "tag";

const PATHS: Record<PictogramName, string> = {
  // A bottle: cap, shoulders, a label band.
  bottle: "M18 5h12v5H18zM18 10v4l-5 6v20a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V20l-5-6v-4M13 27h22",
  // A D-jug: square body, short neck, the handle on the side.
  jug: "M15 10h8v6M15 10v6M10 20a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v20a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3zM36 22h5v8h-5",
  // A pail: tapered body, lid, wire handle.
  pail: "M9 16h30l-3 26H12zM6 16h36M13 16a11 11 0 0 1 22 0M11 24h26",
  // A kit: an open box with two pieces standing in it.
  kit: "M6 18h36v24H6zM6 18l5-9h26l5 9M14 26h8v10h-8zM26 26h8v10h-8z",
  // Cleaners: a trigger-spray bottle.
  spray: "M19 24h14v16a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3zM19 24v-8h6l5-6h-6M25 16l-5 6M30 10h9v4h-4M35 12v4",
  // Lubricants: an oil can with a long spout.
  oilcan: "M9 21h20v18H9zM29 25l12-8v7l-12 5M13 21v-5h12v5M6 39h26",
  // Sealers and coatings: a paint roller.
  roller: "M7 10h26v9H7zM33 14h6v9h-8M31 23v17M26 40h10",
  // A walkthrough: the clipboard the lead hand carries.
  clipboard: "M13 9h22v34H13zM20 6h8v6h-8M18 20h12M18 26h12M18 32h8",
  // Your plant: a sawtooth roof over a floor.
  plant: "M6 42V20l10-7v7l10-7v7l10-7v7l8-6v28M6 42h38M14 30h4v6h-4zM26 30h4v6h-4z",
  // Our facility: a flat-roofed building with a door.
  facility: "M8 42V16h32v26M8 42h32M22 42V30h6v12M14 22h4v4h-4zM28 22h4v4h-4z",
  // Toll blending: a mixing vessel, its shaft and paddle.
  blend: "M10 16h28v20a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6zM24 6v22M17 28l7 4 7-4M20 6h8",
  // Contact: a desk handset on its cradle.
  phone: "M8 30h32v10H8zM8 30l4-8h24l4 8M14 12h20v10H14zM20 17h8",
  // Glossary: a pallet tag with its hole and two printed lines.
  tag: "M6 14h26l10 10-10 10H6zM12 24h1M18 20h10M18 28h7",
};

export function Pictogram({
  name,
  className = "",
  ...rest
}: { name: PictogramName; className?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg viewBox="0 0 48 48" className={`picto ${className}`} aria-hidden="true" focusable="false" {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}
