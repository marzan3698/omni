#!/bin/bash
# Omni CRM - cPanel deployment script
# Runs in single shell so paths and state persist
set -e
LOG="/home/imocis/omni/deploy.log"
exec > "$LOG" 2>&1
echo "=== Deploy started $(date) ==="

REPO="/home/imocis/omni"
DEPLOY="/home/imocis/public_html"

# Add Node.js to PATH (cPanel: EasyApache or nodevenv from Node.js Selector)
for npath in /opt/cpanel/ea-nodejs22/bin /opt/cpanel/ea-nodejs20/bin /opt/cpanel/ea-nodejs18/bin /opt/cpanel/ea-nodejs16/bin; do
  if [ -f "$npath/npm" ]; then
    export PATH="$npath:$PATH"
    echo "Using Node from $npath"
    break
  fi
done
if ! command -v npm &>/dev/null; then
  for npath in /home/imocis/nodevenv/*/bin /home/imocis/nodevenv/versions/node/*/bin; do
    if [ -d "$npath" ] && [ -f "$npath/npm" ]; then
      export PATH="$npath:$PATH"
      echo "Using Node from: $npath"
      break
    fi
  done
fi
if ! command -v npm &>/dev/null; then
  if [ -f /home/imocis/.nvm/nvm.sh ]; then
    . /home/imocis/.nvm/nvm.sh && nvm use default
    echo "Using Node from nvm"
  fi
fi
if ! command -v npm &>/dev/null; then
  echo "ERROR: npm not found. Check Node.js Selector - ensure a Node app exists."
  echo "Run in Terminal: ls -la /opt/cpanel/ea-nodejs*/bin 2>/dev/null || ls -la ~/nodevenv/"
  exit 1
fi
echo "npm: $(which npm); node: $(which node)"

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
cd "$REPO/server" && npm ci --include=dev && npm run build
mkdir -p "$REPO/server/tmp"
touch "$REPO/server/tmp/restart.txt"

echo "=== Deploy finished $(date) ==="
