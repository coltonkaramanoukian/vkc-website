// NC-7: from every FR route the switch resolves to the mapped EN route and
// back. The full map from the pathnames config, not a sample.
import { loadCaptures } from "./lib/captures.ts";
import { localizedPath, routes } from "./lib/routes.ts";

const captures = loadCaptures();
const find = (locale: string, route: string) => captures.find((c) => c.locale === locale && c.route === route);
const failures: string[] = [];

console.log("FR route → switch href → EN route (and back)");
for (const route of routes) {
  const frPath = localizedPath("fr", route);
  const enPath = localizedPath("en", route);
  const frPage = find("fr", route);
  const enPage = find("en", route);
  const there = frPage?.localeSwitch ?? null;
  const back = enPage?.localeSwitch ?? null;
  const ok = there === enPath && back === frPath && frPage?.status === 200 && enPage?.status === 200;
  console.log(`  ${ok ? "✔" : "✖"} ${frPath}  →  ${there}  →  ${back}`);
  if (!ok) failures.push(`${route}: fr→${there} (want ${enPath}), en→${back} (want ${frPath})`);
}

console.log(`\n${routes.length} pairs checked`);
if (failures.length > 0) {
  console.log(`RED — ${failures.length} mismatch(es)`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log("GREEN — every switch lands on the same page in the other locale, both 200");
