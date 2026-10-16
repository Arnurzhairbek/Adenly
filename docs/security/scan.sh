#!/usr/bin/env bash
# Execute from any directory. Writes reports outside the repository.
set -euo pipefail
repo_root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
report_dir=${ADENLY_SECURITY_REPORT_DIR:-/workspace/.adenly-security}
mkdir -p "$report_dir"
# Exit 1 means findings for gitleaks. Keep the underlying exit status visible.
docker run --rm -v "$repo_root:/path:ro" -v "$report_dir:/reports" \
  zricethezav/gitleaks:latest detect --source /path --log-opts=--all \
  --redact=100 --report-format json --report-path /reports/gitleaks-all.json

docker run --rm -v /etc/ssl/certs:/host-certs:ro \
  -e SSL_CERT_FILE=/host-certs/ca-certificates.crt -e SSL_CERT_DIR=/host-certs \
  -v "$repo_root:/src:ro" -v "$report_dir:/reports" \
  aquasec/trivy:latest fs --db-repository ghcr.io/aquasecurity/trivy-db:2 \
  --scanners vuln,misconfig \
  --skip-dirs /src/lang-backend/node_modules,/src/lang-frontend/node_modules,/src/.git \
  --format json --output /reports/trivy.json /src
