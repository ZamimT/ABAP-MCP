#!/usr/bin/env bash
# Claude Code plugin SessionStart hook.
#
# The plugin ships TypeScript source, not a prebuilt dist/. This script builds
# the server on first run and rebuilds automatically whenever package.json
# changes (i.e. after a plugin update that touches dependencies). Repeat
# sessions with an unchanged package.json skip straight past — no rebuild cost.
#
# Runs via Git Bash on Windows, bash/sh on macOS and Linux (see plugins
# reference: command hooks default to bash, PowerShell only as a Windows
# fallback when Git Bash is unavailable).
set -euo pipefail

ROOT="${CLAUDE_PLUGIN_ROOT:-.}"
DATA="${CLAUDE_PLUGIN_DATA:-$ROOT}"
MARKER="$DATA/.build-marker"

cd "$ROOT"

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

CURRENT_HASH="$(hash_file package.json)"
STORED_HASH=""
[ -f "$MARKER" ] && STORED_HASH="$(cat "$MARKER")"

if [ ! -f "dist/index.js" ] || [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "[abap-mcp] Building server (first run or package.json changed) ..." >&2
  npm install --no-audit --no-fund >&2
  npm run build >&2
  echo "$CURRENT_HASH" > "$MARKER"
  echo "[abap-mcp] Build complete." >&2
fi
