#!/usr/bin/env bash
# NC-8: /v redirects by Accept-Language; the QR decodes (independent decoder:
# zbar, on a PNG rendered by Playwright/Chromium) to exactly <baseUrl>/v.
#   scripts/nc/nc8-door-qr.sh <base-url-to-curl> [extra curl header]
set -uo pipefail
cd "$(dirname "$0")/../.."
BASE=${1:-http://localhost:3100}; HDR=${2:-}
WANT="$(python3 -c "import json;print(json.load(open('content/site.json'))['baseUrl'].rstrip('/'))")/v"
H=(); [ -n "$HDR" ] && H=(-H "$HDR")

echo "## 1. /v under three Accept-Language cases ($BASE)"
for al in "en" "fr-CA" ""; do
  if [ -n "$al" ]; then loc=$(curl -sI ${H[@]+"${H[@]}"} -H "Accept-Language: $al" "$BASE/v" | tr -d '\r' | grep -iE '^(HTTP|location)'); label="Accept-Language: $al"
  else loc=$(curl -sI ${H[@]+"${H[@]}"} "$BASE/v" | tr -d '\r' | grep -iE '^(HTTP|location)'); label="(no header)"; fi
  echo "  $label"; echo "$loc" | sed 's/^/    /'
done

decode() {
  node -e '
    const { chromium } = require("@playwright/test");
    const fs = require("fs");
    (async () => {
      const svg = fs.readFileSync("public/qr/v.svg", "utf8");
      const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 640, height: 640 } });
      await p.setContent(`<body style="margin:0;background:#fff"><div style="width:600px;padding:20px">${svg}</div></body>`);
      await p.screenshot({ path: "artifacts/qr-render.png" }); await b.close();
    })();' && zbarimg --raw -q artifacts/qr-render.png
}

echo "## 2. decode the committed QR (want: $WANT)"
got=$(decode); echo "  zbarimg --raw: $got"; [ "$got" = "$WANT" ] && echo "  GREEN: match" || echo "  RED: mismatch"

echo "## 3. regenerate for https://example.com/wrong, decode"
node scripts/qr.ts --url https://example.com/wrong > /dev/null
got=$(decode); echo "  zbarimg --raw: $got"; [ "$got" = "$WANT" ] && echo "  GREEN: match" || echo "  RED: mismatch (as intended)"

echo "## 4. regenerate the real QR (npm run qr), decode"
node scripts/qr.ts > /dev/null
got=$(decode); echo "  zbarimg --raw: $got"; [ "$got" = "$WANT" ] && echo "  GREEN: match" || echo "  RED: mismatch"
