#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Please ask your AI to install Node.js 22 or later, then run this file again.'
  exit 1
fi
node -e 'if(Number(process.versions.node.split(".")[0])<22){console.error("Node.js 22 or later is required.");process.exit(1)}'
exec node server.mjs --open
