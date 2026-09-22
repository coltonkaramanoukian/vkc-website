import localFont from "next/font/local";

// Self-hosted OFL fonts (brand/BRAND.md). Latin subset covers French.
export const archivo = localFont({
  src: "../../brand/fonts/web/Archivo-latin-wdth-wght.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const plexMono = localFont({
  src: "../../brand/fonts/web/IBMPlexMono-latin-500.woff2",
  variable: "--font-plex-mono",
  weight: "500",
  style: "normal",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "monospace"],
});
