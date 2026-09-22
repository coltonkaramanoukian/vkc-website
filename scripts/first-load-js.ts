// DONE #12. Next.js 16 removed the "First Load JS" column from `next build`
// (its upgrade guide says the numbers were inaccurate under RSC), so measure
// it: sum the transfer size of every script a page's HTML loads, plus the
// inline RSC payload the page ships.
// Sizes are what the browser actually downloads (gzip), measured with curl:
// fetch() decompresses transparently, which reports the uncompressed size.
//   node scripts/first-load-js.ts [--base http://localhost:3122]
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { localizedPath, locales, type AppPathname } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const site = JSON.parse(readFileSync("content/site.json", "utf8")) as { baseUrl: string };
const base = flag("--base", site.baseUrl).replace(/\/$/, "");
const ROUTES: AppPathname[] = ["/", "/visit", "/services/second-shift"];
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`;

console.log(`first load JS, measured from ${base} (gzip transfer size)`);
const transfer = (url: string, encoding: string) =>
  Number(
    execFileSync("curl", ["-s", "-H", `Accept-Encoding: ${encoding}`, "-o", "/dev/null", "-w", "%{size_download}", url], {
      encoding: "utf8",
    }),
  );
console.log(
  "  page".padEnd(32) + "scripts".padStart(9) + "JS gzip".padStart(11) + "JS raw".padStart(11) +
    "inline RSC".padStart(13) + "HTML gzip".padStart(12),
);
for (const route of ROUTES) {
  for (const locale of locales) {
    const path = localizedPath(locale, route);
    const html = await (await fetch(base + path)).text();
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    let gzip = 0;
    let raw = 0;
    for (const src of new Set(srcs)) {
      const url = src.startsWith("http") ? src : base + src;
      gzip += transfer(url, "gzip");
      raw += transfer(url, "identity");
    }
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].reduce((n, m) => n + m[1].length, 0);
    console.log(
      `  ${path.padEnd(30)}${String(new Set(srcs).size).padStart(9)}${kb(gzip).padStart(11)}${kb(raw).padStart(11)}` +
        `${kb(inline).padStart(13)}${kb(transfer(base + path, "gzip")).padStart(12)}`,
    );
  }
}
