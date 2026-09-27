#!/bin/bash
# NC-4 (D15): prove the FR-identical check can fail.
# Sets one FR value equal to its EN value, then reverts it. No build needed:
# the identical check reads the message files, and the ratio table reads the
# existing captures.
source "$(dirname "$0")/lib.sh"

echo "=== NC-4 step 0: clean tree (expect GREEN)"
expect green npm run -s guard:fr

echo
echo "=== NC-4 step 1: set pages.privacy.h1 (fr) = pages.privacy.h1 (en)"
python3 - <<'PY'
import json
en=json.load(open('i18n/messages/en.json')); fr=json.load(open('i18n/messages/fr.json'))
fr['pages']['privacy']['h1']=en['pages']['privacy']['h1']
open('i18n/messages/fr.json','w').write(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
PY
expect red npm run -s guard:fr

echo
echo "=== NC-4 step 1b: revert, then put a plain space before a colon in pages.privacy.lead (fr)"
revert_messages
python3 - <<'PY'
import json
fr=json.load(open('i18n/messages/fr.json'))
lead=fr['pages']['privacy']['lead']
fr['pages']['privacy']['lead']=lead.replace(' :', ' :', 1) if ' :' in lead else lead + ' Note : rien.'
open('i18n/messages/fr.json','w').write(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
PY
expect red npm run -s guard:fr

echo
echo "=== NC-4 step 2: revert (expect GREEN)"
revert_messages
expect green npm run -s guard:fr
echo
echo "NC-4 complete. Tree is clean:"
git status --porcelain i18n/messages
