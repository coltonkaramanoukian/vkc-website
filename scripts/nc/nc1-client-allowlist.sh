#!/usr/bin/env bash
# NC-1: an unapproved client name never reaches the build output; an approved one does.
# content/clients.json is NULL AT BIRTH: the injection is restored on every exit path.
set -uo pipefail
cd "$(dirname "$0")/../.."
trap 'git checkout -- content/clients.json' EXIT
build() { npx next build > /tmp/vkc-nc1-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/vkc-nc1-build.log; exit 2; }; }
grepit() { grep -rc TESTCO .next/server/app | grep -v ':0'; }

echo '## step 1: {"name":"TESTCO","approved":false}  → grep must print nothing'
echo '[{"name":"TESTCO","approved":false}]' > content/clients.json; build
out=$(grepit); echo "grep output: [${out}]"; [ -z "$out" ] && echo "PASS (absent)" || echo "FAIL (unapproved name rendered)"

echo '## step 2: approved: true  → grep must find it'
echo '[{"name":"TESTCO","approved":true}]' > content/clients.json; build
out=$(grepit); echo "grep output:"; echo "$out" | head -8; [ -n "$out" ] && echo "PASS (present)" || echo "FAIL (approved name missing)"

echo '## step 3: entry removed  → grep must print nothing'
git checkout -- content/clients.json; cat content/clients.json; build
out=$(grepit); echo "grep output: [${out}]"; [ -z "$out" ] && echo "PASS (absent)" || echo "FAIL"
