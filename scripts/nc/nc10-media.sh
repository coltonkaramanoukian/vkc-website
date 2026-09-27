#!/usr/bin/env bash
# NC-10: the media guard fails on a manifest that points at a file that does
# not exist, and on a video without a poster; passes on the shipped file.
# content/scenes.json is NULL AT BIRTH: the injection is restored on every exit
# path, and this script is the only sanctioned writer (a reverted negative
# control, CLAUDE.md §2).
set -uo pipefail
cd "$(dirname "$0")/../.."
# Restore from a byte copy, not from git: the file may be untracked on a branch
# that has just created it, and a missing restore would leave the injection in.
backup="$(mktemp)"
cp content/scenes.json "$backup"
restore() { cp "$backup" content/scenes.json; }
trap 'restore; rm -f "$backup"' EXIT

echo "## (a) shipped manifest"
node scripts/guard-media.ts; echo "exit $?"

echo "## (b) inject: home-cover → image at /media/does-not-exist.webp"
python3 - <<'PY'
import json
p="content/scenes.json"; d=json.load(open(p))
s=d["slots"][0]; s["kind"]="image"; s["src"]="/media/does-not-exist.webp"; s["alt"]={"en":"x","fr":"y"}
json.dump(d,open(p,"w"),indent=2,ensure_ascii=False)
PY
node scripts/guard-media.ts; echo "exit $? (expected 1)"

echo "## (c) inject: video with no poster, alt.fr missing, remote src"
restore
python3 - <<'PY'
import json
p="content/scenes.json"; d=json.load(open(p))
s=d["slots"][1]; s["kind"]="video"; s["src"]="https://cdn.example.com/x.mp4"; s["alt"]={"en":"x","fr":None}
json.dump(d,open(p,"w"),indent=2,ensure_ascii=False)
PY
node scripts/guard-media.ts; echo "exit $? (expected 1)"

echo "## (d) reverted"
restore
node scripts/guard-media.ts; echo "exit $? (expected 0)"
cmp -s "$backup" content/scenes.json && echo "scenes.json byte-identical to before the run" || echo "FAIL: scenes.json differs from before the run"
