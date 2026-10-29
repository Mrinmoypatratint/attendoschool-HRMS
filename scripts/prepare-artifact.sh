#!/usr/bin/env bash
# ==============================================================================
# prepare-artifact.sh
# ------------------------------------------------------------------------------
# Packages the compiled Vite frontend production distribution into an immutable,
# versioned release tarball with an accompanying SHA256 integrity checksum.
#
# Usage:
#   ./scripts/prepare-artifact.sh <COMMIT_SHA> [OUTPUT_DIR]
#
# Example:
#   ./scripts/prepare-artifact.sh abc1234 ./dist-artifacts
# ==============================================================================

set -euo pipefail

COMMIT_SHA="${1:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
OUTPUT_DIR="${2:-./dist-artifacts}"
DIST_DIR="./frontend/dist"

echo "=== Preparing Release Artifact ==="
echo "Commit SHA : ${COMMIT_SHA}"
echo "Dist Source: ${DIST_DIR}"
echo "Artifact Out: ${OUTPUT_DIR}"

# 1. Validate that the compiled distribution exists
if [ ! -d "${DIST_DIR}" ]; then
  echo "[-] ERROR: Source distribution directory '${DIST_DIR}' does not exist." >&2
  echo "    Did you run 'npm -w frontend run build' first?" >&2
  exit 1
fi

if [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "[-] ERROR: Missing '${DIST_DIR}/index.html'. The build output is invalid." >&2
  exit 1
fi

# 2. Ensure output directory exists
mkdir -p "${OUTPUT_DIR}"

# 3. Create the release tarball
TARBALL_NAME="hrms-frontend-${COMMIT_SHA}.tar.gz"
TARBALL_PATH="${OUTPUT_DIR}/${TARBALL_NAME}"
CHECKSUM_PATH="${OUTPUT_DIR}/${TARBALL_NAME}.sha256"

echo "[+] Creating archive ${TARBALL_NAME}..."
# Archive contents of frontend/dist directly so extraction lays down index.html at release root
tar -czf "${TARBALL_PATH}" -C "${DIST_DIR}" .

# 4. Generate SHA256 Checksum
echo "[+] Generating SHA256 checksum..."
if command -v sha256sum >/dev/null 2>&1; then
  (cd "${OUTPUT_DIR}" && sha256sum "${TARBALL_NAME}" > "${TARBALL_NAME}.sha256")
elif command -v shasum >/dev/null 2>&1; then
  (cd "${OUTPUT_DIR}" && shasum -a 256 "${TARBALL_NAME}" > "${TARBALL_NAME}.sha256")
else
  echo "[-] Warning: neither sha256sum nor shasum found on system." >&2
fi

echo "[✓] Artifact packaged successfully:"
echo "    Archive : ${TARBALL_PATH} ($(du -h "${TARBALL_PATH}" | cut -f1))"
if [ -f "${CHECKSUM_PATH}" ]; then
  echo "    Checksum: $(cat "${CHECKSUM_PATH}")"
fi
