#!/usr/bin/env bash
# NC-6: (a) placeholder marker only when NEXT_PUBLIC_SHOW_PLACEHOLDERS=1, and no empty
# photo wrappers otherwise; (b) a <video> only when media.json has a source;
# (c) every img/video src stays inside /photos/, /video/, /qr/ or /brand/.
# content/media.json is RESERVED: the injection is restored on every exit path.
set -uo pipefail
cd "$(dirname "$0")/../.."
trap 'git checkout -- content/media.json' EXIT
build() { env "$@" npx next build > /tmp/vkc-nc6-build.log 2>&1 || { echo BUILD FAILED; tail -20 /tmp/vkc-nc6-build.log; exit 2; }; }
html() { find .next/server/app -name '*.html'; }
count() { html | xargs grep -o "$1" 2>/dev/null | wc -l | tr -d ' '; }

echo "## (a1) NEXT_PUBLIC_SHOW_PLACEHOLDERS=1"
build NEXT_PUBLIC_SHOW_PLACEHOLDERS=1
echo "placeholder elements (class=\"vkc-photo-placeholder) in HTML: $(count 'class="vkc-photo-placeholder')"
html | xargs grep -l 'class="vkc-photo-placeholder' | sed 's#.next/server/app/#  #'
echo "## (a2) placeholders unset (production)"
build NEXT_PUBLIC_SHOW_PLACEHOLDERS=
echo "placeholder elements: $(count 'class="vkc-photo-placeholder')"
echo "<figure> wrappers: $(count '<figure')   data-photo-slot attributes: $(count 'data-photo-slot')"

echo "## (b1) media.json all null"
echo "<video in fr.html/en.html/fr/visit.html/en/visit.html: $(grep -o '<video' .next/server/app/fr.html .next/server/app/en.html .next/server/app/fr/visit.html .next/server/app/en/visit.html | wc -l | tr -d ' ')"
echo "## (b2) demo.en.landscape = /video/test.mp4"
python3 -c "import json;p='content/media.json';d=json.load(open(p));d['demo']['en']['landscape']='/video/test.mp4';json.dump(d,open(p,'w'),indent=2)"
build
grep -o '<video[^>]*>' .next/server/app/en/visit.html | head -2
echo "<video in en/visit.html: $(grep -o '<video' .next/server/app/en/visit.html | wc -l | tr -d ' ')   in fr/visit.html: $(grep -o '<video' .next/server/app/fr/visit.html | wc -l | tr -d ' ')"
echo "## (b3) reverted"
git checkout -- content/media.json
build
echo "<video in en/visit.html: $(grep -o '<video' .next/server/app/en/visit.html | wc -l | tr -d ' ')"

echo "## (c) every <img src> / <video src> / <source src> in the build"
srcs=$(html | xargs grep -ohE '<(img|video|source)[^>]* src="[^"]*"' | grep -oE 'src="[^"]*"' | sort | uniq -c)
echo "${srcs:-  (none: the pages ship no <img>, <video> or <source> elements)}"
bad=$(echo "$srcs" | grep -oE 'src="[^"]*"' | grep -vE 'src="/(photos|video|qr|brand)/' || true)
[ -z "$bad" ] && echo "PASS: nothing points outside /photos/ /video/ /qr/ /brand/" || { echo "FAIL:"; echo "$bad"; }
