import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/components/wordmark-data";
import { site, tagline } from "@/lib/content";
import { isLocale, locales } from "@/i18n/pathnames";

// One OG image per locale (D10): the wordmark, the shipped tagline, the fill line.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = site.brandName;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const INK = "#15171a";
const FONT_DIR = join(process.cwd(), "brand/fonts/ttf/static");

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "fr";
  const [display, medium] = await Promise.all([
    readFile(join(FONT_DIR, "Archivo-SemiExpanded-ExtraBold.ttf")),
    readFile(join(FONT_DIR, "Archivo-Medium.ttf")),
  ]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORDMARK_VIEWBOX}" fill="${INK}">${WORDMARK_PATHS.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  const wordmark = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const [vbX, vbY, vbW, vbH] = WORDMARK_VIEWBOX.split(" ").map(Number);
  void vbX;
  void vbY;
  const wordmarkWidth = 440;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edeff2", padding: 48 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            background: "#ffffff",
            border: `4px solid ${INK}`,
            padding: "52px 60px",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={wordmark} width={wordmarkWidth} height={Math.round((wordmarkWidth * vbH) / vbW)} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Archivo Display",
                fontSize: 78,
                lineHeight: 1.04,
                letterSpacing: -1,
                color: INK,
                maxWidth: 960,
              }}
            >
              {tagline(locale)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 36 }}>
              <div style={{ width: 120, height: 8, background: INK }} />
              <div style={{ flexGrow: 1, height: 2, background: "#c7ccd3" }} />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo Display", data: display, style: "normal", weight: 800 },
        { name: "Archivo", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
