#!/bin/bash
# NC-3 (D5/§1): prove the invented-number guard can fail.
# Injects "5,000 units per day" into one page, then reverts it.
source "$(dirname "$0")/lib.sh"

echo "=== NC-3 step 0: clean tree (expect GREEN)"
expect green npm run -s guard:numbers

echo
echo "=== NC-3 step 1: inject \"5,000 units per day\" into the EN contract packaging page"
python3 - <<'PY'
import json
en=json.load(open('i18n/messages/en.json'))
en['pages']['contractPackaging']['lead'] += " Our line runs 5,000 units per day."
open('i18n/messages/en.json','w').write(json.dumps(en,ensure_ascii=False,indent=2)+'\n')
PY
build_render
expect red npm run -s guard:numbers

echo
echo "=== NC-3 step 2: remove it (expect GREEN)"
revert_messages
build_render
expect green npm run -s guard:numbers
echo
echo "NC-3 complete. Tree is clean:"
git status --porcelain i18n/messages
