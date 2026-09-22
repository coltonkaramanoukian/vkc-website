#!/bin/bash
# NC-2 (D16): prove the staffing guard can fail, both ways.
#   absence: inject a term list hit on the EN and FR Second Shift pages
#   presence: delete the FR lead-hand fact
# Injections are reverted in the same run. Usage: scripts/nc/nc2-staffing.sh
source "$(dirname "$0")/lib.sh"

echo "=== NC-2 step 0: clean tree (expect GREEN)"
expect green npm run -s guard:staffing

echo
echo "=== NC-2 step 1: inject \"extra hands billed hourly\" (EN) and \"main-d'oeuvre\" (FR)"
python3 - <<'PY'
import json
en=json.load(open('i18n/messages/en.json')); fr=json.load(open('i18n/messages/fr.json'))
en['pages']['secondShift']['lead'] += " We supply extra hands billed hourly."
fr['pages']['secondShift']['lead'] += " On fournit de la main-d’œuvre en renfort."
open('i18n/messages/en.json','w').write(json.dumps(en,ensure_ascii=False,indent=2)+'\n')
open('i18n/messages/fr.json','w').write(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
PY
build_render
expect red npm run -s guard:staffing

echo
echo "=== NC-2 step 2: remove the injection (expect GREEN)"
revert_messages
build_render
expect green npm run -s guard:staffing

echo
echo "=== NC-2 step 3: delete the FR lead-hand fact (expect RED on presence)"
python3 - <<'PY'
import json
fr=json.load(open('i18n/messages/fr.json'))
fr['services']['ss']['directedBy']="Le quart roule"
p=fr['pages']['secondShift']
p['sections'][1]['split'][0]['items'][0]="Le quart roule du début à la fin."
p['sections'][3]['steps'][2]="Le jour venu, le quart roule sur votre ligne."
open('i18n/messages/fr.json','w').write(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
PY
build_render
expect red npm run -s guard:staffing

echo
echo "=== NC-2 step 4: restore it (expect GREEN)"
revert_messages
build_render
expect green npm run -s guard:staffing
echo
echo "NC-2 complete: red then green, both directions. Tree is clean:"
git status --porcelain i18n/messages
