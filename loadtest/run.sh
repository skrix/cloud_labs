#!/usr/bin/env bash
# Runs the k6 load test.
# Usage: [BASE_URL=http://...] [VUS=40] loadtest/run.sh
# Results: loadtest/results/<timestamp>/{report.md,summary.json}
set -euo pipefail

cd "$(dirname "$0")"

if [[ -z "${BASE_URL:-}" ]]; then
  BASE_URL="$(terraform -chdir=../deploy/aws/terraform output -raw url 2>/dev/null || true)"
fi
: "${BASE_URL:?set BASE_URL (or run terraform apply first)}"
export BASE_URL

# The service (and its database) must be up: after a deploy it may still be migrating/seeding.
health="${BASE_URL%/}/api/health/db"
for attempt in {1..12}; do
  curl -fsS -m 5 -o /dev/null "$health" && break
  if (( attempt == 12 )); then
    echo "service is not up: $health" >&2
    exit 1
  fi
  echo "waiting for $health ($attempt/12)"
  sleep 5
done

out="results/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$out"
echo "load test against $BASE_URL, results in loadtest/$out"

status=0
RESULTS_DIR="$out" k6 run script.js || status=$?

[[ -f "$out/report.md" ]] && cat "$out/report.md"
exit "$status"
