#!/bin/bash
# MD-Logistique — Lance les 3 serveurs d'un coup
# Usage : ./start.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Python avec les packages installés (pyenv)
PYTHON="/Users/hajarbelmoudden/.pyenv/versions/3.7.13/bin/python3"

# Couleurs
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     MD-Logistique — Démarrage        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Libère les ports si déjà occupés
for PORT in 4000 8000 5173; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "${YELLOW}⚠  Port $PORT occupé (PID $PID) — libération...${NC}"
    kill "$PID" 2>/dev/null
    sleep 1
  fi
done

# ── 1. Backend Node.js (port 4000) ──────────────────────────────────────────
echo -e "${GREEN}▶  Backend Node.js   → http://localhost:4000${NC}"
cd "$ROOT/backend" && node src/server.js > "$ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# ── 2. FastAPI Payroll (port 8000) ──────────────────────────────────────────
echo -e "${GREEN}▶  FastAPI Payroll   → http://localhost:8000${NC}"
mkdir -p "$ROOT/logs"
"$PYTHON" "$ROOT/backend/payroll_api.py" > "$ROOT/logs/fastapi.log" 2>&1 &
FASTAPI_PID=$!

# ── 3. Frontend React (port 5173) ───────────────────────────────────────────
echo -e "${GREEN}▶  Frontend React    → http://localhost:5173${NC}"
cd "$ROOT/frontend" && npm run dev > "$ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo ""
echo -e "   PIDs : backend=$BACKEND_PID  fastapi=$FASTAPI_PID  frontend=$FRONTEND_PID"
echo ""

# Attente démarrage
echo -n "   Démarrage"
for i in 1 2 3 4 5; do sleep 1; echo -n "."; done
echo ""
echo ""

# Vérifications
check() {
  local NAME=$1 URL=$2
  if curl -sf "$URL" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC}  $NAME  ($URL)"
  else
    echo -e "   ${RED}✗${NC}  $NAME — ERREUR (voir logs/$NAME.log)"
  fi
}

check "backend" "http://localhost:4000/health"
check "fastapi " "http://localhost:8000/api/payroll/health"
echo -e "   ${GREEN}✓${NC}  frontend → http://localhost:5173"

echo ""
echo -e "${CYAN}   Ouvre http://localhost:5173/payroll${NC}"
echo ""
echo "   Logs disponibles dans logs/"
echo "   Ctrl+C pour tout arrêter"
echo ""

# Garde le script actif et arrête tout à Ctrl+C
trap "echo ''; echo 'Arrêt des serveurs...'; kill $BACKEND_PID $FASTAPI_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
