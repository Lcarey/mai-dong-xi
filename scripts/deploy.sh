#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Building shared types"
npm run build:shared

echo "→ Building API Lambda bundle"
npm run build:api

echo "→ Building web app"
npm run build:web

echo "→ Deploying CDK stack (infra + API Lambda)"
npm run deploy -w @maidongxi/infra

echo "→ Uploading web assets"
./scripts/deploy-web.sh
