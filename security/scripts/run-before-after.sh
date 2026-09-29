#!/bin/bash
# =============================================================================
# Before/After Security Scan Runner
# =============================================================================
# Runs all security scans in both baseline and hardened modes.
#
# Usage:
#   chmod +x security/scripts/run-before-after.sh
#   ./security/scripts/run-before-after.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=============================================="
echo "BEFORE/AFTER SECURITY SCAN"
echo "=============================================="
echo ""

# Create output directories
mkdir -p "$PROJECT_DIR/security/scans/before"
mkdir -p "$PROJECT_DIR/security/scans/after"
mkdir -p "$PROJECT_DIR/security/evidence"

# -------------------------------------------------------
# Phase 1: Scan BASELINE mode
# -------------------------------------------------------
echo "--- Phase 1: Scanning BASELINE mode ---"
echo ""

# Run dependency scan
echo "[1/3] Running dependency scan..."
cd "$PROJECT_DIR"
node security/scripts/dependency-scan.js 2>&1 | tee security/scans/before/dependency-scan.txt

# Run header scan (requires server running in baseline mode)
echo ""
echo "[2/3] Running header scan..."
echo "  NOTE: Ensure server is running with SECURITY_MODE=baseline"
node security/scripts/header-scan.js 2>&1 | tee security/scans/before/header-scan.txt || true

# Run fingerprint scan
echo ""
echo "[3/3] Running fingerprint scan..."
node security/scripts/fingerprint-scan.js 2>&1 | tee security/scans/before/fingerprint-scan.txt || true

# Copy evidence
cp security/reports/header-scan.json security/evidence/before-headers.json 2>/dev/null || true
cp security/reports/fingerprint-report.json security/evidence/before-fingerprint.json 2>/dev/null || true
cp security/reports/dependency-inventory.json security/evidence/before-dependencies.json 2>/dev/null || true

echo ""
echo "--- Phase 1 Complete ---"
echo ""

# -------------------------------------------------------
# Phase 2: Instructions for HARDENED mode
# -------------------------------------------------------
echo "--- Phase 2: Hardened Mode ---"
echo ""
echo "To scan hardened mode:"
echo "  1. Stop the server"
echo "  2. Set SECURITY_MODE=hardened in .env"
echo "  3. Restart the server"
echo "  4. Run: node security/scripts/run-security-tests.js --mode hardened"
echo "  5. Run: node security/scripts/header-scan.js"
echo "  6. Run: node security/scripts/fingerprint-scan.js"
echo ""
echo "Copy results to security/scans/after/ and security/evidence/"
echo ""
echo "=============================================="
echo "SCAN COMPLETE"
echo "=============================================="
