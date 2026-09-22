// npm run qr  →  public/qr/v.svg encoding `<content/site.json baseUrl>/v`.
// After a domain change: edit site.json baseUrl, run this, rebuild, redeploy.
// Flags (for NC-8 only): --url <override>  --out <path>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import QRCode from "qrcode";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const site = JSON.parse(
  readFileSync(new URL("../content/site.json", import.meta.url), "utf8"),
) as { baseUrl: string };

const target = flag("--url") ?? `${site.baseUrl.replace(/\/$/, "")}/v`;
const out = flag("--out") ?? new URL("../public/qr/v.svg", import.meta.url).pathname;

// Error correction Q (~25% recoverable): above the brief's floor of M, for
// codes printed on flyers that get folded, scuffed and scanned at a doorstep.
const svg = await QRCode.toString(target, {
  type: "svg",
  errorCorrectionLevel: "Q",
  margin: 4,
  color: { dark: "#15171aff", light: "#ffffffff" },
});

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`QR written: ${out}\n  encodes: ${target}\n  error correction: Q`);
