#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

cd "$(dirname "$0")/.."

readonly ENV_FILE="${ENV_FILE:-.env.production}"
readonly COMPOSE_FILE="compose.production.yml"
readonly BACKUP_DIR="backups"
readonly RELEASE_FILE=".release"

fail() { printf '[deploy] %s\n' "$*" >&2; exit 1; }
env_value() { sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1 | tr -d "\047\""; }

command -v docker >/dev/null || fail "Docker is required"
command -v git >/dev/null || fail "Git is required"
test -f "$ENV_FILE" || fail "Create $ENV_FILE from .env.production.example"
test -z "$(git status --porcelain)" || fail "Commit the release before deploying"

for key in POSTGRES_PASSWORD NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY IP_HASH_SECRET; do
  value="$(env_value "$key")"
  test -n "$value" || fail "$key is missing"
  case "$value" in *replace-with*) fail "$key still contains a placeholder" ;; esac
done
test "$(env_value NEXT_PUBLIC_SITE_URL)" = "https://spin.justours.love" || fail "NEXT_PUBLIC_SITE_URL must be https://spin.justours.love"
[[ "$(env_value POSTGRES_PASSWORD)" =~ ^[0-9a-f]{64}$ ]] || fail "POSTGRES_PASSWORD must be 64 lowercase hex characters"
test "$(env_value NEXT_PUBLIC_TURNSTILE_SITE_KEY)" != "1x00000000000000000000AA" || fail "Production Turnstile site key is required"
test "$(env_value TURNSTILE_SECRET_KEY)" != "1x0000000000000000000000000000000AA" || fail "Production Turnstile secret key is required"
test "${#value}" -ge 32 || fail "IP_HASH_SECRET must be at least 32 characters"
chmod 600 "$ENV_FILE"

readonly COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
"${COMPOSE[@]}" config --quiet
docker network inspect "$(env_value EDGE_NETWORK)" >/dev/null || fail "Shared edge network is missing"

readonly IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short=12 HEAD)"
export IMAGE_TAG
printf '[deploy] building %s\n' "$IMAGE_TAG"
"${COMPOSE[@]}" build --pull app
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 db

mkdir -p "$BACKUP_DIR"
backup="$BACKUP_DIR/lovespin-$(date -u +%Y%m%d%H%M%S)-pre-$IMAGE_TAG.dump"
"${COMPOSE[@]}" exec -T db sh -ec 'exec pg_dump -U lovespin -d lovespin --format=custom' > "$backup"
test -s "$backup" || fail "Database backup is empty"
printf '[deploy] database backup: %s\n' "$backup"

"${COMPOSE[@]}" up -d --wait --wait-timeout 180 app cleanup
"${COMPOSE[@]}" exec -T app wget -q -O - http://127.0.0.1:3000/api/healthz
printf '%s\n' "$IMAGE_TAG" > "$RELEASE_FILE"
"${COMPOSE[@]}" ps
printf '[deploy] release %s is healthy\n' "$IMAGE_TAG"
