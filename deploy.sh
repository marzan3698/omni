#!/bin/bash

# Omni CRM Deployment Script
# This script is executed on the server during deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
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

# Configuration
PROJECT_DIR="/var/www/omni"
CLIENT_DIR="${PROJECT_DIR}/client"
SERVER_DIR="${PROJECT_DIR}/server"
PM2_APP_NAME="omni-crm"

log "Starting deployment process..."

# Navigate to project directory
cd "${PROJECT_DIR}" || error "Failed to navigate to project directory"

# Step 1: Pull latest code
log "Pulling latest code from Git..."
git fetch origin
git reset --hard origin/main || error "Failed to pull latest code"

# Step 2: Install client dependencies
log "Installing client dependencies..."
cd "${CLIENT_DIR}" || error "Failed to navigate to client directory"
npm ci --production=false || error "Failed to install client dependencies"

# Step 3: Build client
log "Building client application..."
npm run build || error "Client build failed"

# Step 4: Install server dependencies
log "Installing server dependencies..."
cd "${SERVER_DIR}" || error "Failed to navigate to server directory"
npm ci --production=false || error "Failed to install server dependencies"

# Step 5: Generate Prisma Client
log "Generating Prisma Client..."
npx prisma generate || error "Failed to generate Prisma Client"

# Step 6: Run database migrations
log "Running database migrations..."
npx prisma migrate deploy || warning "Database migrations failed or no migrations to run"

# Step 7: Build server
log "Building server application..."
npm run build || error "Server build failed"

# Step 8: Restart PM2 application
log "Restarting PM2 application..."
pm2 restart "${PM2_APP_NAME}" || error "Failed to restart PM2 application"

# Wait a moment for PM2 to restart
sleep 3

# Step 9: Check PM2 status
log "Checking PM2 status..."
pm2 status "${PM2_APP_NAME}" || error "PM2 application is not running"

# Step 10: Reload Nginx (if configured)
log "Reloading Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t && nginx -s reload || systemctl reload nginx || warning "Nginx reload failed (may not be critical)"
else
    warning "Nginx not found, skipping reload"
fi

log "Deployment completed successfully!"
log "PM2 Status:"
pm2 status "${PM2_APP_NAME}"

