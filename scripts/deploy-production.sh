#!/usr/bin/env bash
# ==============================================================================
# deploy-production.sh
# ------------------------------------------------------------------------------
# Performs a zero-downtime atomic release deployment on the Hostinger VPS.
#
# Release Directory Structure:
#   /var/www/hrms-attendoschool/
#   ├── releases/
#   │   ├── <commit-sha-1>/
#   │   └── <commit-sha-2>/
#   ├── shared/
#   └── current -> releases/<active-commit>
#
# Usage:
#   ./scripts/deploy-production.sh <TARBALL_PATH> <COMMIT_SHA> [BASE_DIR]
#
# Example:
#   ./scripts/deploy-production.sh /tmp/hrms-frontend-abc1234.tar.gz abc1234 /var/www/hrms-attendoschool
# ==============================================================================

set -euo pipefail

TARBALL_PATH="${1:-}"
COMMIT_SHA="${2:-}"
BASE_DIR="${3:-/home/attendoschool-hrms/htdocs/hrms.attendoschool.online}"
KEEP_RELEASES="${4:-5}"

if [ -z "${TARBALL_PATH}" ] || [ -z "${COMMIT_SHA}" ]; then
  echo "[-] ERROR: Missing required arguments." >&2
  echo "    Usage: $0 <TARBALL_PATH> <COMMIT_SHA> [BASE_DIR] [KEEP_RELEASES]" >&2
  exit 1
fi

if [ ! -f "${TARBALL_PATH}" ]; then
  echo "[-] ERROR: Release tarball '${TARBALL_PATH}' does not exist." >&2
  exit 1
fi

RELEASES_DIR="${BASE_DIR}/releases"
SHARED_DIR="${BASE_DIR}/shared"
CURRENT_LINK="${BASE_DIR}/current"
PREVIOUS_LINK="${BASE_DIR}/previous"
TARGET_RELEASE_DIR="${RELEASES_DIR}/${COMMIT_SHA}"
STAGING_RELEASE_DIR="${RELEASES_DIR}/${COMMIT_SHA}.staging.$$"

echo "=========================================================="
echo "  AttendoSchool HRMS — Atomic Zero-Downtime Deployment   "
echo "=========================================================="
echo "Commit SHA    : ${COMMIT_SHA}"
echo "Tarball       : ${TARBALL_PATH}"
echo "Base Directory: ${BASE_DIR}"
echo "Timestamp     : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "----------------------------------------------------------"

# 1. Integrity Check: Verify SHA256 Checksum if present
CHECKSUM_FILE="${TARBALL_PATH}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "[1/7] Verifying artifact checksum..."
  TARBALL_DIR="$(dirname "${TARBALL_PATH}")"
  TARBALL_FILE="$(basename "${TARBALL_PATH}")"
  (cd "${TARBALL_DIR}" && sha256sum -c "$(basename "${CHECKSUM_FILE}")")
  echo "      [✓] Checksum matches."
else
  echo "[1/7] (Notice) No checksum file found; skipping sha256 pre-verification."
fi

# 2. Ensure destination hierarchy exists
echo "[2/7] Preparing directory structure..."
mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}"

# 3. Clean up any existing directory for this commit to allow safe redeployment
if [ -d "${TARGET_RELEASE_DIR}" ]; then
  echo "      [!] Existing release directory for ${COMMIT_SHA} detected. Backing up..."
  rm -rf "${TARGET_RELEASE_DIR}.old"
  mv "${TARGET_RELEASE_DIR}" "${TARGET_RELEASE_DIR}.old"
fi
rm -rf "${STAGING_RELEASE_DIR}"
mkdir -p "${STAGING_RELEASE_DIR}"

# 4. Extract tarball into isolated staging directory
echo "[3/7] Extracting release artifact into staging..."
tar -xzf "${TARBALL_PATH}" -C "${STAGING_RELEASE_DIR}"
find "${STAGING_RELEASE_DIR}" -type d -exec chmod 755 {} +
find "${STAGING_RELEASE_DIR}" -type f -exec chmod 644 {} +

# 5. Structure & Sanity Verification of Staged Release
echo "[4/7] Verifying staged release structure..."
if [ ! -f "${STAGING_RELEASE_DIR}/index.html" ]; then
  echo "[-] FATAL: Staged release is missing 'index.html'. Aborting deployment." >&2
  rm -rf "${STAGING_RELEASE_DIR}"
  exit 1
fi

if [ ! -d "${STAGING_RELEASE_DIR}/assets" ]; then
  echo "[-] FATAL: Staged release is missing 'assets/' directory. Aborting deployment." >&2
  rm -rf "${STAGING_RELEASE_DIR}"
  exit 1
fi

# Inject release metadata file
cat <<EOF > "${STAGING_RELEASE_DIR}/release-info.json"
{
  "commitSha": "${COMMIT_SHA}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployedBy": "${USER:-unknown}",
  "hostname": "$(hostname 2>/dev/null || echo 'vps')"
}
EOF

# Move staging into final immutable release path
mv "${STAGING_RELEASE_DIR}" "${TARGET_RELEASE_DIR}"
echo "      [✓] Release staged at ${TARGET_RELEASE_DIR}"

# 6. Atomic Symlink Activation
echo "[5/7] Activating release atomically..."

# Record current target as previous before updating
if [ -L "${CURRENT_LINK}" ]; then
  OLD_ACTIVE="$(readlink -f "${CURRENT_LINK}" || true)"
  if [ -n "${OLD_ACTIVE}" ] && [ -d "${OLD_ACTIVE}" ]; then
    ln -sfn "${OLD_ACTIVE}" "${PREVIOUS_LINK}"
    echo "      [✓] Recorded previous release: $(basename "${OLD_ACTIVE}")"
  fi
fi

# Create a temporary symlink and rename it atomically (POSIX atomic rename)
TMP_LINK="${BASE_DIR}/current.tmp.$$"
ln -s "${TARGET_RELEASE_DIR}" "${TMP_LINK}"
mv -Tf "${TMP_LINK}" "${CURRENT_LINK}"
echo "      [✓] Symlink 'current' atomically updated -> ${TARGET_RELEASE_DIR}"

# 7. Reload Nginx (Optional, only if permitted; symlink change is already live)
echo "[6/7] Reloading web server..."
if command -v nginx >/dev/null 2>&1; then
  if sudo -n nginx -t >/dev/null 2>&1; then
    sudo -n systemctl reload nginx 2>/dev/null && echo "      [✓] Nginx reloaded successfully." || true
  else
    echo "      (Notice) Nginx config reload skipped; atomic symlink is already actively serving."
  fi
else
  echo "      (Notice) Nginx binary not found in path; skipping reload."
fi

# 8. Retention Cleanup: Keep only last N releases
echo "[7/7] Pruning old releases (retaining last ${KEEP_RELEASES})..."
# List release directories sorted by modification time (oldest first)
cd "${RELEASES_DIR}"
RELEASE_COUNT=$(find . -maxdepth 1 -mindepth 1 -type d ! -name "*.staging*" ! -name "*.old" | wc -l)

if [ "${RELEASE_COUNT}" -gt "${KEEP_RELEASES}" ]; then
  PRUNE_COUNT=$(( RELEASE_COUNT - KEEP_RELEASES ))
  # Delete oldest releases that are NOT currently pointed to by 'current' or 'previous'
  find . -maxdepth 1 -mindepth 1 -type d ! -name "*.staging*" ! -name "*.old" -printf '%T+ %p\n' \
    | sort \
    | head -n "${PRUNE_COUNT}" \
    | awk '{print $2}' \
    | while read -r old_dir; do
        FULL_PATH="$(readlink -f "${old_dir}" || true)"
        CURR_PATH="$(readlink -f "${CURRENT_LINK}" || true)"
        PREV_PATH="$(readlink -f "${PREVIOUS_LINK}" || true)"
        if [ "${FULL_PATH}" != "${CURR_PATH}" ] && [ "${FULL_PATH}" != "${PREV_PATH}" ]; then
          echo "      [-] Pruning old release: ${old_dir}"
          rm -rf "${old_dir}"
        fi
      done
fi

# Clean up any leftover temporary staging directories older than 1 hour
find "${RELEASES_DIR}" -maxdepth 1 -name "*.staging*" -mmin +60 -exec rm -rf {} + 2>/dev/null || true
find "${RELEASES_DIR}" -maxdepth 1 -name "*.old" -mmin +60 -exec rm -rf {} + 2>/dev/null || true

echo "=========================================================="
echo "  [✓] Release ${COMMIT_SHA} deployed successfully!         "
echo "=========================================================="
