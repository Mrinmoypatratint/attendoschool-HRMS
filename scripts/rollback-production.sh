#!/usr/bin/env bash
# ==============================================================================
# rollback-production.sh
# ------------------------------------------------------------------------------
# Immediately restores the previous known-good release on the Hostinger VPS.
#
# Usage:
#   ./scripts/rollback-production.sh [TARGET_SHA] [BASE_DIR]
#
# If TARGET_SHA is omitted, automatically restores the release pointed to by 'previous',
# or the most recent prior release directory.
# ==============================================================================

set -euo pipefail

TARGET_SHA="${1:-}"
BASE_DIR="${2:-/home/attendoschool-hrms/htdocs/hrms.attendoschool.online}"

RELEASES_DIR="${BASE_DIR}/releases"
SHARED_DIR="${BASE_DIR}/shared"
CURRENT_LINK="${BASE_DIR}/current"
PREVIOUS_LINK="${BASE_DIR}/previous"
ROLLBACK_LOG="${SHARED_DIR}/rollback.log"

echo "=========================================================="
echo "  AttendoSchool HRMS — Release Rollback Procedure        "
echo "=========================================================="
echo "Base Directory: ${BASE_DIR}"
echo "Timestamp     : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "----------------------------------------------------------"

mkdir -p "${SHARED_DIR}"

CURRENT_ACTIVE=""
if [ -L "${CURRENT_LINK}" ]; then
  CURRENT_ACTIVE="$(readlink -f "${CURRENT_LINK}")"
  echo "[+] Current failing release: $(basename "${CURRENT_ACTIVE}")"
fi

# Determine rollback target directory
ROLLBACK_TARGET=""

if [ -n "${TARGET_SHA}" ]; then
  SPECIFIED_DIR="${RELEASES_DIR}/${TARGET_SHA}"
  if [ -d "${SPECIFIED_DIR}" ]; then
    ROLLBACK_TARGET="${SPECIFIED_DIR}"
    echo "[+] Using requested target release: ${TARGET_SHA}"
  else
    echo "[-] ERROR: Specified release directory '${SPECIFIED_DIR}' not found." >&2
    exit 1
  fi
elif [ -L "${PREVIOUS_LINK}" ] && [ -d "$(readlink -f "${PREVIOUS_LINK}")" ]; then
  ROLLBACK_TARGET="$(readlink -f "${PREVIOUS_LINK}")"
  echo "[+] Using recorded 'previous' symlink target: $(basename "${ROLLBACK_TARGET}")"
else
  # Find most recent release directory that is NOT the current active one
  echo "[!] 'previous' link not found. Searching releases directory for latest fallback..."
  CANDIDATE=$(find "${RELEASES_DIR}" -maxdepth 1 -mindepth 1 -type d ! -name "*.staging*" ! -name "*.old" \
    | grep -v "^${CURRENT_ACTIVE}$" \
    | xargs -I {} stat -c '%Y %n' "{}" 2>/dev/null \
    | sort -nr \
    | head -n 1 \
    | awk '{print $2}' || echo "")
  
  if [ -n "${CANDIDATE}" ] && [ -d "${CANDIDATE}" ]; then
    ROLLBACK_TARGET="${CANDIDATE}"
    echo "[+] Discovered prior release: $(basename "${ROLLBACK_TARGET}")"
  fi
fi

if [ -z "${ROLLBACK_TARGET}" ] || [ ! -d "${ROLLBACK_TARGET}" ]; then
  echo "[-] FATAL: No valid prior release found in '${RELEASES_DIR}' to roll back to!" >&2
  exit 1
fi

if [ "${ROLLBACK_TARGET}" = "${CURRENT_ACTIVE}" ]; then
  echo "[-] FATAL: Rollback target is identical to currently active release. Cannot roll back to self." >&2
  exit 1
fi

# Sanity check on the rollback target
if [ ! -f "${ROLLBACK_TARGET}/index.html" ]; then
  echo "[-] FATAL: Rollback candidate '${ROLLBACK_TARGET}' is corrupted (missing index.html)." >&2
  exit 1
fi

# Execute atomic symlink reversal
echo "[+] Atomically restoring symlink 'current' -> ${ROLLBACK_TARGET}..."
TMP_LINK="${BASE_DIR}/current.rollback.tmp.$$"
ln -s "${ROLLBACK_TARGET}" "${TMP_LINK}"
mv -Tf "${TMP_LINK}" "${CURRENT_LINK}"

# Sync rollback files to BASE_DIR for CloudPanel compatibility
cp -r "${ROLLBACK_TARGET}/"* "${BASE_DIR}/" 2>/dev/null || true
chmod 644 "${BASE_DIR}/index.html" 2>/dev/null || true
chmod -R 755 "${BASE_DIR}/assets" 2>/dev/null || true

# Reload Nginx (optional)
echo "[+] Reloading web server..."
if command -v nginx >/dev/null 2>&1; then
  if sudo -n nginx -t >/dev/null 2>&1; then
    sudo -n systemctl reload nginx 2>/dev/null && echo "    [✓] Nginx reloaded." || true
  fi
fi

# Audit Log
LOG_MSG="$(date -u +"%Y-%m-%dT%H:%M:%SZ") | ROLLBACK EXECUTED | From: $(basename "${CURRENT_ACTIVE:-unknown}") | Restored: $(basename "${ROLLBACK_TARGET}") | By: ${USER:-unknown}"
echo "${LOG_MSG}" >> "${ROLLBACK_LOG}"
echo "[+] Rollback event recorded in ${ROLLBACK_LOG}"

# Re-run health check
echo "[+] Re-verifying restored release health..."
SCRIPT_DIR="$(dirname "$0")"
if [ -f "${SCRIPT_DIR}/verify-release.sh" ]; then
  "${SCRIPT_DIR}/verify-release.sh" "hrms.attendoschool.online" "${BASE_DIR}"
fi

echo "=========================================================="
echo "  [✓] ROLLBACK COMPLETE: Active release restored to $(basename "${ROLLBACK_TARGET}")"
echo "=========================================================="
