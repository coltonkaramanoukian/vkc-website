import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

// Web app manifest: name from content/site.json, colours from brand/tokens.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brandName,
    short_name: "VKC",
    start_url: "/",
    display: "browser",
    background_color: "#edeff2",
    theme_color: "#ffffff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
