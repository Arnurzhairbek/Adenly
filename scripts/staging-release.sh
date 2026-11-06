#!/usr/bin/env bash
# Run on the staging host. No database down/delete/reset, no automatic schema migrations.
set -euo pipefail
umask 077
operation=${1:?release or rollback}
target=${2:?full commit SHA}
app_root=${3:-/srv/adenly-staging}
[[ "$operation" == release || "$operation" == rollback ]]
[[ "$target" =~ ^[0-9a-f]{40}$ ]]
[[ "$app_root" = /* && "$app_root" != / ]]
release_dir="$app_root/releases/$target"
env_file="$app_root/shared/staging.env"
[[ -d "$release_dir/ops" && -f "$env_file" ]]
export RELEASE_SHA="$target"
project=${STAGING_PROJECT:-adenly-staging}
[[ "$project" =~ ^[a-z0-9][a-z0-9_-]+$ ]]
compose=(docker compose -p "$project" --env-file "$env_file" -f "$release_dir/ops/staging.compose.yml")
"${compose[@]}" config --quiet
mkdir -p "$app_root/backups"
if [[ "$operation" == release ]]; then
  if ! docker image inspect "adently-backend:$target" >/dev/null 2>&1; then
    docker build -t "adently-backend:$target" "$release_dir/lang-backend"
  fi
  if ! docker image inspect "adently-frontend:$target" >/dev/null 2>&1; then
    docker build --build-arg VITE_API_URL=/api -t "adently-frontend:$target" "$release_dir/lang-frontend"
  fi
else
  # Rollback must use retained images; rebuilding an old SHA is not a verified rollback.
  docker image inspect "adently-backend:$target" "adently-frontend:$target" >/dev/null
fi
if "${compose[@]}" ps --status running --services | grep -qx postgres; then
  "${compose[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$app_root/backups/pre-$(date -u +%Y%m%dT%H%M%SZ).sql"
fi
"${compose[@]}" up -d --wait --wait-timeout 150
port=$(sed -n 's/^STAGING_HTTP_PORT=//p' "$env_file" | tail -1)
port=${port:-8080}
[[ "$port" =~ ^[0-9]+$ ]]
curl --fail --silent --show-error "http://127.0.0.1:$port/health" | python3 -c 'import json,sys;assert json.load(sys.stdin)["databaseReady"] is True'
curl --fail --silent --show-error "http://127.0.0.1:$port/api/courses" | python3 -c 'import json,sys;assert isinstance(json.load(sys.stdin),list)'
curl --fail --silent --show-error "http://127.0.0.1:$port/" >/dev/null
if [[ -f "$app_root/current" ]]; then cp "$app_root/current" "$app_root/previous"; fi
printf '%s\n' "$target" > "$app_root/current.next"
mv "$app_root/current.next" "$app_root/current"
printf 'Verified %s: %s\n' "$operation" "$target"
