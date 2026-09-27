import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/components/wordmark-data";
import { OG_SIZE } from "@/lib/og-keys";

/** Open Graph card: the wordmark, one headline, the fill line. */
const INK = "#15171a";
const FLOOR = "#edeff2";
const LABEL = "#ffffff";
const HAIRLINE = "#c7ccd3";
const FONT_DIR = join(process.cwd(), "brand/fonts/ttf/static");
const WORDMARK_WIDTH = 440;

/** Display size steps down as the headline gets longer, so it never overflows. */
function headlineSize(text: string): number {
  if (text.length <= 40) return 78;
  if (text.length <= 64) return 62;
  return 50;
}

export async function renderOgImage(headline: string): Promise<ImageResponse> {
  const [display, medium] = await Promise.all([
    readFile(join(FONT_DIR, "Archivo-SemiExpanded-ExtraBold.ttf")),
    readFile(join(FONT_DIR, "Archivo-Medium.ttf")),
  ]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORDMARK_VIEWBOX}" fill="${INK}">${WORDMARK_PATHS.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  const wordmark = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const [, , vbW, vbH] = WORDMARK_VIEWBOX.split(" ").map(Number);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: FLOOR, padding: 48 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            background: LABEL,
            border: `4px solid ${INK}`,
            padding: "52px 60px",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element -- ImageResponse renders satori, not the DOM */}
          <img src={wordmark} width={WORDMARK_WIDTH} height={Math.round((WORDMARK_WIDTH * vbH) / vbW)} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Archivo Display",
                fontSize: headlineSize(headline),
                lineHeight: 1.04,
                letterSpacing: -1,
                color: INK,
                maxWidth: 1000,
              }}
            >
              {headline}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 36 }}>
              <div style={{ width: 120, height: 8, background: INK }} />
              <div style={{ flexGrow: 1, height: 2, background: HAIRLINE }} />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Archivo Display", data: display, style: "normal", weight: 800 },
        { name: "Archivo", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
