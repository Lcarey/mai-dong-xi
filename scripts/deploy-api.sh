#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Building shared types"
npm run build:shared --silent
echo "→ Building API Lambda bundle"
npm run build:api --silent

echo "→ Hotswap deploy (Lambda code only — no CloudFormation)"
npm run hotswap -w @maidongxi/infra
