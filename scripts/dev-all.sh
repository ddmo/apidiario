#!/usr/bin/env bash
# Avvia tutto l'ambiente di sviluppo locale: App, Sito, Docs, Supabase, proxy Caddy.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ sudo necessario per Caddy (porta 443 + certificati locali)"
sudo -v

echo "→ Supabase locale..."
if ! npx supabase status >/dev/null 2>&1; then
  npx supabase start
fi

PIDS=()
cleanup() {
  echo ""
  echo "→ arresto..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  sudo -k
}
trap cleanup EXIT INT TERM

run() {
  local name="$1"; shift
  ( "$@" 2>&1 | sed -u "s/^/[$name] /" ) &
  PIDS+=($!)
}

run "app"   npm run dev
run "docs"  bash -c "cd docs && npm start"
run "sito"  npx serve site -l 8788
run "proxy" sudo -n caddy run --config Caddyfile.local

cat <<'EOF'

Pronto (hot-reload attivo su app e docs):
  Sito  → https://www.apidiario-dev.it
  Docs  → https://www.apidiario-dev.it/docs
  App   → https://my.apidiario-dev.it

Ctrl+C per fermare tutto.
EOF

wait
