# Shared helpers for the negative-control scripts.
# Every injection lives in the working tree only and is reverted in the same run.
set -euo pipefail
cd "$(dirname "$0")/../.."
PORT="${NC_PORT:-3110}"

build_render() { # build, serve, render every route, stop
  npm run -s build >/tmp/nc-build.log 2>&1 || { tail -20 /tmp/nc-build.log; exit 1; }
  npx next start -p "$PORT" >/tmp/nc-serve.log 2>&1 &
  local pid=$!
  for _ in $(seq 1 90); do curl -sf "http://localhost:$PORT/robots.txt" >/dev/null && break; sleep 1; done
  node scripts/render-all.ts --base "http://localhost:$PORT" 2>/dev/null | tail -1
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}

expect() { # expect red|green <command...>
  local want="$1"; shift
  local out status
  set +e
  out="$("$@" 2>&1 | grep -v 'MODULE_TYPELESS\|Reparsing as ES module\|trace-warnings\|eliminate this warning')"
  status=${PIPESTATUS[0]}
  set -e
  echo "$out"
  if [ "$want" = red ] && [ "$status" -eq 0 ]; then echo "NC FAILED: expected a red exit, got green"; exit 1; fi
  if [ "$want" = green ] && [ "$status" -ne 0 ]; then echo "NC FAILED: expected green, got exit $status"; exit 1; fi
}

revert_messages() { git checkout -- i18n/messages; }
