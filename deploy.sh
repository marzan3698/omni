#!/bin/bash
# Omni CRM - cPanel deployment script
# Runs in single shell so paths and state persist
set -e
LOG="/home/imocis/omni/deploy.log"
exec > "$LOG" 2>&1
echo "=== Deploy started $(date) ==="

REPO="/home/imocis/omni"
DEPLOY="/home/imocis/public_html"

echo "Building client..."
cd "$REPO/client" && npm ci && npm run build
echo "Client build done. Contents of dist:"
ls -la "$REPO/client/dist/" || echo "dist missing!"

echo "Clearing public_html..."
rm -rf "$DEPLOY"/* 2>/dev/null || true
echo "Copying client build..."
cp -R "$REPO/client/dist/." "$DEPLOY/"
echo "Copied. Contents of public_html:"
ls -la "$DEPLOY/"

echo "Building server..."
cd "$REPO/server" && npm ci && npm run build
mkdir -p "$REPO/server/tmp"
touch "$REPO/server/tmp/restart.txt"

echo "=== Deploy finished $(date) ==="
