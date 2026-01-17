#!/bin/bash

# Omni CRM - cPanel Auto Deployment Script
# This script runs automatically when code is pushed to GitHub
# It builds and deploys both frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get the directory where this script is located
# In cPanel Git, this will be the repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || error "Failed to navigate to project directory"

log "========================================="
log "Starting Omni CRM Deployment"
log "========================================="
log "Working directory: $SCRIPT_DIR"

# Configuration - Adjust these paths based on your cPanel setup
# Option 1: If frontend and backend are in same repository
CLIENT_DIR="${SCRIPT_DIR}/client"
SERVER_DIR="${SCRIPT_DIR}/server"

# Option 2: If you want to deploy to specific locations
# Uncomment and adjust these if needed:
# FRONTEND_DEPLOY_DIR="$HOME/public_html"
# BACKEND_DEPLOY_DIR="$HOME/api"

# Step 1: Pull latest code (if not already done by Git hook)
log "Step 1: Checking for latest code..."
if [ -d ".git" ]; then
    git fetch origin || warning "Git fetch failed (may not be critical if already up to date)"
    git reset --hard origin/main || warning "Git reset failed"
else
    warning "Not a git repository, skipping git pull"
fi

# Step 2: Install client dependencies
log "Step 2: Installing client dependencies..."
if [ -d "$CLIENT_DIR" ]; then
    cd "$CLIENT_DIR" || error "Failed to navigate to client directory"
    npm install --production=false || error "Failed to install client dependencies"
    log "✅ Client dependencies installed"
else
    error "Client directory not found: $CLIENT_DIR"
fi

# Step 3: Build client
log "Step 3: Building client application..."
npm run build || error "Client build failed"
log "✅ Client build completed"

# Step 4: Install server dependencies
log "Step 4: Installing server dependencies..."
cd "$SERVER_DIR" || error "Failed to navigate to server directory"
npm install --production=false || error "Failed to install server dependencies"
log "✅ Server dependencies installed"

# Step 5: Generate Prisma Client
log "Step 5: Generating Prisma Client..."
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate || error "Failed to generate Prisma Client"
    log "✅ Prisma Client generated"
else
    warning "Prisma schema not found, skipping Prisma generate"
fi

# Step 6: Build server
log "Step 6: Building server application..."
npm run build || error "Server build failed"
log "✅ Server build completed"

# Step 7: Deploy frontend to public_html (if FRONTEND_DEPLOY_DIR is set)
if [ -n "$FRONTEND_DEPLOY_DIR" ] && [ -d "$FRONTEND_DEPLOY_DIR" ]; then
    log "Step 7: Copying frontend files to $FRONTEND_DEPLOY_DIR..."
    cp -r "$CLIENT_DIR/dist"/* "$FRONTEND_DEPLOY_DIR/" || warning "Failed to copy frontend files"
    log "✅ Frontend files copied"
else
    info "Frontend deploy directory not set, skipping copy"
    info "Frontend build is in: $CLIENT_DIR/dist"
fi

# Step 8: Deploy backend (if BACKEND_DEPLOY_DIR is set)
if [ -n "$BACKEND_DEPLOY_DIR" ] && [ -d "$BACKEND_DEPLOY_DIR" ]; then
    log "Step 8: Copying backend files to $BACKEND_DEPLOY_DIR..."
    mkdir -p "$BACKEND_DEPLOY_DIR"
    cp -r "$SERVER_DIR/dist" "$BACKEND_DEPLOY_DIR/" || warning "Failed to copy backend dist"
    cp -r "$SERVER_DIR/node_modules" "$BACKEND_DEPLOY_DIR/" || warning "Failed to copy node_modules"
    cp "$SERVER_DIR/package.json" "$BACKEND_DEPLOY_DIR/" || warning "Failed to copy package.json"
    cp -r "$SERVER_DIR/prisma" "$BACKEND_DEPLOY_DIR/" || warning "Failed to copy prisma"
    log "✅ Backend files copied"
else
    info "Backend deploy directory not set, skipping copy"
    info "Backend build is in: $SERVER_DIR/dist"
fi

# Step 9: Restart Node.js application (cPanel Node.js Selector)
# Note: This depends on how you've configured Node.js in cPanel
# You may need to adjust this based on your setup
log "Step 9: Node.js application restart..."
info "Note: You may need to restart Node.js app manually from cPanel Node.js Selector"
info "Or use: /usr/local/bin/nodejsctl restart <app_name>"

# Alternative: If you have PM2 or other process manager
# pm2 restart omni-crm || warning "PM2 restart failed (may not be installed)"

log "========================================="
log "✅ Deployment completed successfully!"
log "========================================="
log ""
log "Next steps:"
log "1. Verify frontend is accessible"
log "2. Restart Node.js application from cPanel"
log "3. Check application logs for any errors"
log ""
