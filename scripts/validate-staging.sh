#!/usr/bin/env bash
# Isolated CI drill. These fixture releases are NEVER GitHub deployment/incident records.
set -euo pipefail
sha=${1:?current full SHA}
[[ "$sha" =~ ^[0-9a-f]{40}$ ]]
fixture=ffffffffffffffffffffffffffffffffffffffff
[[ "$sha" != "$fixture" ]]
sandbox_dir=$(mktemp -d)
export STAGING_PROJECT="adenly-ci-validation-${RANDOM}"
python3 scripts/staging_init.py --root "$sandbox_dir" --port 18080
python3 scripts/staging_preflight.py "$sandbox_dir"
for target in "$sha" "$fixture"; do
  mkdir -p "$sandbox_dir/releases/$target/scripts"
  cp -R ops "$sandbox_dir/releases/$target/ops"
  cp scripts/staging-release.sh "$sandbox_dir/releases/$target/scripts/"
done
cleanup() {
  # Only this script's random, synthetic project and temporary files are removed.
  RELEASE_SHA="$sha" docker compose -p "$STAGING_PROJECT" --env-file "$sandbox_dir/shared/staging.env" -f "$sandbox_dir/releases/$sha/ops/staging.compose.yml" down -v >/dev/null 2>&1 || true
  rm -rf "$sandbox_dir"
}
trap cleanup EXIT
docker tag "adently-backend:$sha" "adently-backend:$fixture"
docker tag "adently-frontend:$sha" "adently-frontend:$fixture"
started=$(date +%s)
bash scripts/staging-release.sh release "$sha" "$sandbox_dir"
compose=(docker compose -p "$STAGING_PROJECT" --env-file "$sandbox_dir/shared/staging.env" -f "$sandbox_dir/releases/$sha/ops/staging.compose.yml")
"${compose[@]}" exec -T postgres psql -U adenly -d adenly_staging -c "INSERT INTO courses(title) VALUES ('CI rollback sentinel');" >/dev/null
bash scripts/staging-release.sh release "$fixture" "$sandbox_dir"
[[ $(cat "$sandbox_dir/current") == "$fixture" ]]
rollback_started=$(date +%s)
bash scripts/staging-release.sh rollback "$sha" "$sandbox_dir"
[[ $(cat "$sandbox_dir/current") == "$sha" ]]
rows=$("${compose[@]}" exec -T postgres psql -U adenly -d adenly_staging -Atqc "SELECT count(*) FROM courses WHERE title='CI rollback sentinel';")
[[ "$rows" == 1 ]]
find "$sandbox_dir/backups" -name '*.sql' -type f | python3 -c 'import sys; assert len(sys.stdin.read().splitlines()) >= 2'
printf 'STAGING_DRILL_OK rollback_seconds=%s total_seconds=%s database_sentinel_preserved=true\n' "$(( $(date +%s)-rollback_started ))" "$(( $(date +%s)-started ))"
