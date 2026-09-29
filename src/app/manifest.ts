import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

// Web app manifest: name from content/site.json, colours from brand/tokens.css.
// The site is dark (:root, color-scheme: dark). theme_color and background_color
// use the floor token #0b0c0e — the same value the page's <meta name="theme-color">
// ships — so the install toolbar and the add-to-home-screen splash match the
// site instead of the pre-redesign light values (#ffffff / #edeff2).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brandName,
    short_name: "VKC",
    start_url: "/",
    display: "browser",
    background_color: "#0b0c0e",
    theme_color: "#0b0c0e",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
