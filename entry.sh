#!/usr/bin/env sh
set -eu

# Simple boot script for ClawCloud: pull latest code and start API
# Usage in ClawCloud UI:
#  - Command: /bin/sh
#  - Arguments: /app/Kitanime/entry.sh

APP_DIR="${APP_DIR:-/app/Kitanime}"
API_DIR="$APP_DIR/api"

echo "[entry] Working dir: $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  echo "[entry] ERROR: $APP_DIR is not a git repo. Did you clone the repo into /app/Kitanime?" >&2
  exit 1
fi

if command -v git >/dev/null 2>&1; then
  echo "[entry] Fetching latest code from origin/main..."
  git -C "$APP_DIR" fetch --all -p || true
  git -C "$APP_DIR" checkout -q main || true
  git -C "$APP_DIR" reset --hard origin/main || true
else
  echo "[entry] git not found in container; skipping auto-pull."
fi

echo "[entry] Installing API dependencies..."
if [ -f "$API_DIR/package-lock.json" ]; then
  npm --prefix "$API_DIR" ci --omit=dev
else
  npm --prefix "$API_DIR" install --omit=dev
fi

PORT="${PORT:-3000}"
echo "[entry] Starting API on port $PORT..."
exec node "$API_DIR/index.js"
