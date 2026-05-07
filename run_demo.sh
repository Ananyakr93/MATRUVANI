#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# MATRUVANI — Local Demo Launcher
# Team CareCoders | RVCE, Bengaluru
# ═══════════════════════════════════════════════════════════════════════════
# Usage:
#   chmod +x run_demo.sh && ./run_demo.sh
#
# What it does:
#   1. Creates a Python virtual environment (if needed)
#   2. Installs all dependencies
#   3. Seeds the SQLite database with 50 synthetic patients
#   4. Starts Flask on port 5000 in the background
#   5. Opens the ASHA PWA + Dashboard in the default browser
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Colour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR="venv"
PORT=5000
BASE_URL="http://127.0.0.1:${PORT}"

echo ""
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}    MATRUVANI — Perinatal Mental Health Screening Platform     ${NC}"
echo -e "${CYAN}${BOLD}    Team CareCoders | RVCE, Bengaluru                          ${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ── Step 1: Virtual Environment ───────────────────────────────────────────
echo -e "${YELLOW}[1/5]${NC} Setting up Python virtual environment..."

if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo -e "  ${GREEN}✓${NC} Created virtual environment in ./${VENV_DIR}"
else
    echo -e "  ${GREEN}✓${NC} Virtual environment already exists"
fi

# Activate venv
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate" 2>/dev/null || source "${VENV_DIR}/Scripts/activate" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Activated virtual environment"

# ── Step 2: Install Dependencies ──────────────────────────────────────────
echo -e "${YELLOW}[2/5]${NC} Installing dependencies..."
pip install -q -r requirements.txt
echo -e "  ${GREEN}✓${NC} All dependencies installed"

# ── Step 3: Seed Database ─────────────────────────────────────────────────
echo -e "${YELLOW}[3/5]${NC} Seeding database with synthetic data..."
python seed.py
echo -e "  ${GREEN}✓${NC} Database seeded"

# ── Step 4: Start Flask Server ────────────────────────────────────────────
echo -e "${YELLOW}[4/5]${NC} Starting Flask server on port ${PORT}..."

# Kill any existing process on the port
if lsof -i :"$PORT" -t &>/dev/null; then
    echo -e "  ${RED}!${NC} Port ${PORT} in use — killing existing process"
    kill "$(lsof -i :${PORT} -t)" 2>/dev/null || true
    sleep 1
fi

# Start Flask in background
FLASK_APP=app.py FLASK_ENV=development python app.py &
FLASK_PID=$!
echo -e "  ${GREEN}✓${NC} Flask server started (PID: ${FLASK_PID})"

# Wait for server to be ready
echo -ne "  Waiting for server..."
for i in $(seq 1 15); do
    if curl -s -o /dev/null -w "" "${BASE_URL}/" 2>/dev/null; then
        echo -e " ${GREEN}ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ "$i" -eq 15 ]; then
        echo -e " ${RED}timeout — check logs${NC}"
    fi
done

# ── Step 5: Open Browser ─────────────────────────────────────────────────
echo -e "${YELLOW}[5/5]${NC} Opening application in browser..."

DASHBOARD_URL="${BASE_URL}/dashboard.html"
ASHA_PWA_URL="${BASE_URL}/"

# Detect OS and open browser
open_url() {
    local url="$1"
    if command -v xdg-open &>/dev/null; then
        xdg-open "$url" 2>/dev/null &
    elif command -v open &>/dev/null; then
        open "$url" 2>/dev/null &
    elif command -v start &>/dev/null; then
        start "$url" 2>/dev/null &
    else
        echo -e "  ${RED}!${NC} Could not detect browser — open manually: $url"
    fi
}

open_url "$DASHBOARD_URL"
sleep 1
open_url "$ASHA_PWA_URL"

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  MATRUVANI demo is running!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Dashboard:${NC}   ${CYAN}${DASHBOARD_URL}${NC}"
echo -e "  ${BOLD}ASHA PWA:${NC}    ${CYAN}${ASHA_PWA_URL}${NC}"
echo -e "  ${BOLD}API Base:${NC}    ${CYAN}${BASE_URL}/api/${NC}"
echo -e "  ${BOLD}Flask PID:${NC}   ${FLASK_PID}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# ── Trap: Graceful shutdown ───────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down MATRUVANI...${NC}"
    kill "$FLASK_PID" 2>/dev/null || true
    echo -e "${GREEN}✓ Server stopped. Goodbye!${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Keep script alive to catch Ctrl+C
wait "$FLASK_PID"
