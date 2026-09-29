#!/bin/bash
# =============================================================================
# Blog Security Audit — Dual Instance Launcher
# =============================================================================
# Starts BOTH the baseline (vulnerable) and hardened (secure) instances
# simultaneously on separate ports for side-by-side comparison.
#
# Architecture:
#   BASELINE:  Frontend http://localhost:5173  →  Backend http://localhost:5001
#   HARDENED:  Frontend http://localhost:5174  →  Backend http://localhost:5002
#
# Usage:
#   chmod +x start-dual.sh
#   ./start-dual.sh
#
# To stop all instances:
#   Press Ctrl+C (kills all background processes)
# =============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}║         🛡️  Blog Security Audit — Dual Mode Launcher  🛡️        ║${NC}"
echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Trap Ctrl+C to kill all background processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down all instances...${NC}"
  kill 0 2>/dev/null
  echo -e "${GREEN}All instances stopped.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# =============================================================================
# Start Baseline Backend (Port 5001)
# =============================================================================
echo -e "${RED}${BOLD}▶ Starting BASELINE backend on port 5001...${NC}"
echo -e "${RED}  ⚠️  INTENTIONALLY VULNERABLE — DO NOT expose to the internet${NC}"
cd "$ROOT_DIR/server"
ENV_FILE=.env.baseline node src/app.js &
BASELINE_BACKEND_PID=$!

# =============================================================================
# Start Hardened Backend (Port 5002)
# =============================================================================
echo -e "${GREEN}${BOLD}▶ Starting HARDENED backend on port 5002...${NC}"
echo -e "${GREEN}  ✅ All security controls active${NC}"
cd "$ROOT_DIR/server"
ENV_FILE=.env.hardened node src/app.js &
HARDENED_BACKEND_PID=$!

# Wait a moment for backends to initialize
sleep 2

# =============================================================================
# Start Baseline Frontend (Port 5173)
# =============================================================================
echo -e "${RED}${BOLD}▶ Starting BASELINE frontend on port 5173...${NC}"
cd "$ROOT_DIR/client"
npx vite --config vite.config.baseline.js &
BASELINE_FRONTEND_PID=$!

# =============================================================================
# Start Hardened Frontend (Port 5174)
# =============================================================================
echo -e "${GREEN}${BOLD}▶ Starting HARDENED frontend on port 5174...${NC}"
cd "$ROOT_DIR/client"
npx vite --config vite.config.hardened.js &
HARDENED_FRONTEND_PID=$!

# =============================================================================
# Summary
# =============================================================================
sleep 3
echo ""
echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}║                    All Instances Running                        ║${NC}"
echo -e "${PURPLE}${BOLD}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${PURPLE}║                                                                  ${NC}"
echo -e "${PURPLE}║  ${RED}🔓 BASELINE (Vulnerable)${NC}                                       ${NC}"
echo -e "${PURPLE}║     Frontend: ${CYAN}http://localhost:5173${NC}                              ${NC}"
echo -e "${PURPLE}║     Backend:  ${CYAN}http://localhost:5001${NC}                              ${NC}"
echo -e "${PURPLE}║                                                                  ${NC}"
echo -e "${PURPLE}║  ${GREEN}🔒 HARDENED (Secure)${NC}                                           ${NC}"
echo -e "${PURPLE}║     Frontend: ${CYAN}http://localhost:5174${NC}                              ${NC}"
echo -e "${PURPLE}║     Backend:  ${CYAN}http://localhost:5002${NC}                              ${NC}"
echo -e "${PURPLE}║                                                                  ${NC}"
echo -e "${PURPLE}║  ${YELLOW}Demo Accounts:${NC}                                                 ${NC}"
echo -e "${PURPLE}║     Admin: admin@blog.local / Admin@123                          ${NC}"
echo -e "${PURPLE}║     User:  alice@blog.local / Alice@123                          ${NC}"
echo -e "${PURPLE}║                                                                  ${NC}"
echo -e "${PURPLE}║  ${YELLOW}Press Ctrl+C to stop all instances${NC}                              ${NC}"
echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for all background processes
wait
