#!/bin/bash
# NC-9 (CLAUDE.md §1/§4, brief §6 DON'T): prove the forbidden-claims guard can
# fail. Injects a certification claim and a superlative, then reverts both.
# This control exists because run 1 shipped the word "fastest" on /visit for a
# whole phase with every other guard green: nothing was watching for it.
source "$(dirname "$0")/lib.sh"

echo "=== NC-9 step 0: clean tree (expect GREEN)"
expect green npm run -s guard:claims

echo
echo "=== NC-9 step 1: inject an ISO claim (EN) and a superlative (FR)"
python3 - <<'PY'
import json
en=json.load(open('i18n/messages/en.json')); fr=json.load(open('i18n/messages/fr.json'))
en['pages']['about']['lead'] += " We are ISO 9001 certified."
fr['pages']['about']['lead'] += " Le chef de file du conditionnement au Québec."
open('i18n/messages/en.json','w').write(json.dumps(en,ensure_ascii=False,indent=2)+'\n')
open('i18n/messages/fr.json','w').write(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
PY
build_render
expect red npm run -s guard:claims

echo
echo "=== NC-9 step 2: revert (expect GREEN, with the /about denials still allowed)"
revert_messages
build_render
expect green npm run -s guard:claims
echo
echo "NC-9 complete. Tree is clean:"
git status --porcelain i18n/messages
