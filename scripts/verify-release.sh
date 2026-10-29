#!/usr/bin/env bash
# ==============================================================================
# verify-release.sh
# ------------------------------------------------------------------------------
# Performs layered health and smoke-test verification on the newly activated release.
#
# Verification Layers:
#   Layer 1: Release Filesystem Integrity (Symlink, index.html, release metadata)
#   Layer 2: Local Web Server HTTP Delivery (Root URL returns HTTP 200)
#   Layer 3: Static Asset Resolution (JavaScript & CSS chunks load with 200 OK)
#   Layer 4: Direct SPA Route Fallback (/login, /attendance return index.html)
#
# Usage:
#   ./scripts/verify-release.sh [HOST] [BASE_DIR]
#
# Example:
#   ./scripts/verify-release.sh hrms.attendoschool.online /var/www/hrms-attendoschool
# ==============================================================================

set -euo pipefail

HOST_HEADER="${1:-hrms.attendoschool.online}"
BASE_DIR="${2:-/var/www/hrms-attendoschool}"
CURRENT_LINK="${BASE_DIR}/current"
LOCAL_URL="http://127.0.0.1"

echo "=========================================================="
echo "  AttendoSchool HRMS — Release Health Verification       "
echo "=========================================================="
echo "Host Header   : ${HOST_HEADER}"
echo "Current Link  : ${CURRENT_LINK}"
echo "Timestamp     : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "----------------------------------------------------------"

FAILURES=0

record_pass() {
  echo "  [✓] PASS: $1"
}

record_fail() {
  echo "  [✗] FAIL: $1" >&2
  FAILURES=$(( FAILURES + 1 ))
}

# ------------------------------------------------------------------------------
# Layer 1: Filesystem & Symlink Verification
# ------------------------------------------------------------------------------
echo "--- [Layer 1] Filesystem & Release Integrity ---"

if [ ! -L "${CURRENT_LINK}" ]; then
  record_fail "Symlink '${CURRENT_LINK}' does not exist or is not a symlink."
else
  ACTIVE_DIR="$(readlink -f "${CURRENT_LINK}")"
  record_pass "Symlink points to: ${ACTIVE_DIR}"
fi

INDEX_FILE="${CURRENT_LINK}/index.html"
if [ ! -f "${INDEX_FILE}" ]; then
  record_fail "index.html is missing at ${INDEX_FILE}"
else
  record_pass "index.html exists ($(stat -c%s "${INDEX_FILE}" 2>/dev/null || wc -c < "${INDEX_FILE}") bytes)"
  if grep -q 'id="root"' "${INDEX_FILE}"; then
    record_pass "index.html contains React '#root' mount element."
  else
    record_fail "index.html does not contain '#root' mount point."
  fi
fi

if [ -f "${CURRENT_LINK}/release-info.json" ]; then
  record_pass "Release metadata: $(cat "${CURRENT_LINK}/release-info.json" | tr -d '\n')"
else
  record_fail "release-info.json metadata is missing."
fi

# ------------------------------------------------------------------------------
# Layer 2: Web Server HTTP Connectivity
# ------------------------------------------------------------------------------
echo "--- [Layer 2] Web Server HTTP Root Response ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${HOST_HEADER}" "${LOCAL_URL}/" || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  record_pass "HTTP GET / returned status 200 OK."
else
  record_fail "HTTP GET / returned status ${HTTP_CODE} (expected 200)."
fi

# ------------------------------------------------------------------------------
# Layer 3: Static Asset Resolution (JS and CSS)
# ------------------------------------------------------------------------------
echo "--- [Layer 3] Static Assets Availability ---"

# Extract main JavaScript entry file from index.html
JS_ASSET=$(grep -o -E 'src="[^"]*\.js"' "${INDEX_FILE}" | head -n 1 | cut -d'"' -f2 || echo "")
if [ -n "${JS_ASSET}" ]; then
  JS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${HOST_HEADER}" "${LOCAL_URL}${JS_ASSET}" || echo "000")
  if [ "${JS_CODE}" = "200" ]; then
    record_pass "Main JavaScript chunk (${JS_ASSET}) returned 200 OK."
  else
    record_fail "Main JavaScript chunk (${JS_ASSET}) returned ${JS_CODE}."
  fi
else
  record_fail "Could not detect main JavaScript asset in index.html."
fi

# Extract main CSS file from index.html
CSS_ASSET=$(grep -o -E 'href="[^"]*\.css"' "${INDEX_FILE}" | head -n 1 | cut -d'"' -f2 || echo "")
if [ -n "${CSS_ASSET}" ]; then
  CSS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${HOST_HEADER}" "${LOCAL_URL}${CSS_ASSET}" || echo "000")
  if [ "${CSS_CODE}" = "200" ]; then
    record_pass "Main CSS chunk (${CSS_ASSET}) returned 200 OK."
  else
    record_fail "Main CSS chunk (${CSS_ASSET}) returned ${CSS_CODE}."
  fi
else
  record_fail "Could not detect main CSS asset in index.html."
fi

# ------------------------------------------------------------------------------
# Layer 4: Direct SPA Routing Fallback
# ------------------------------------------------------------------------------
echo "--- [Layer 4] Direct SPA Route Resolution ---"

# Test direct navigation to /login
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${HOST_HEADER}" "${LOCAL_URL}/login" || echo "000")
if [ "${LOGIN_CODE}" = "200" ]; then
  record_pass "Direct SPA route /login returned 200 OK."
else
  record_fail "Direct SPA route /login returned ${LOGIN_CODE} (expected 200 via fallback)."
fi

# Test direct navigation to /attendance
ATT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${HOST_HEADER}" "${LOCAL_URL}/attendance" || echo "000")
if [ "${ATT_CODE}" = "200" ]; then
  record_pass "Direct SPA route /attendance returned 200 OK."
else
  record_fail "Direct SPA route /attendance returned ${ATT_CODE} (expected 200 via fallback)."
fi

# ------------------------------------------------------------------------------
# Final Verification Assessment
# ------------------------------------------------------------------------------
echo "----------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "  [✓] ALL HEALTH CHECKS PASSED. Release verified successfully!"
  echo "=========================================================="
  exit 0
else
  echo "  [-] VERIFICATION FAILED: ${FAILURES} check(s) did not pass."
  echo "=========================================================="
  exit 1
fi
