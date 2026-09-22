// Route census: status code of every URL (from the pathnames map) plus /v
// under three Accept-Language cases. No redirects followed.
//   node scripts/census.ts --base <url> [--header "name: value"]
import { allUrls, expectedPageCount } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const base = (flag("--base") ?? "http://localhost:3100").replace(/\/$/, "");
const headerArg = flag("--header");
const extra: Record<string, string> = headerArg
  ? { [headerArg.split(":")[0].trim()]: headerArg.slice(headerArg.indexOf(":") + 1).trim() }
  : {};

const urls = allUrls();
let ok = 0;
for (const url of urls) {
  const res = await fetch(base + url.path, { redirect: "manual", headers: extra });
  if (res.status === 200) ok += 1;
  console.log(`${res.status} ${url.path}`);
}
console.log(`\n${ok}/${expectedPageCount()} returned 200`);

const cases: [string, string | null, string][] = [
  ["Accept-Language: en", "en", "/en/visit"],
  ["Accept-Language: fr-CA", "fr-CA", "/fr/visite"],
  ["no Accept-Language", null, "/fr/visite"],
];
let vOk = 0;
console.log("\n/v door route:");
for (const [label, value, want] of cases) {
  const headers: Record<string, string> = { ...extra };
  if (value) headers["accept-language"] = value;
  const res = await fetch(`${base}/v`, { redirect: "manual", headers });
  const location = res.headers.get("location");
  const pass = res.status === 307 && location === want;
  if (pass) vOk += 1;
  console.log(`  ${pass ? "✔" : "✖"} ${label.padEnd(24)} → ${res.status} Location: ${location}  (want 307 ${want})`);
}

if (ok !== expectedPageCount() || vOk !== cases.length) process.exit(1);
