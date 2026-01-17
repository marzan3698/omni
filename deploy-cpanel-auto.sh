#!/bin/bash

# Omni CRM - Automatic Deployment Script for cPanel
# This script is executed by GitHub Actions via SSH after code is pushed
# It deploys both frontend (to public_html) and backend (to ~/api)

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || error "Failed to navigate to project directory"

# Step 0: Find and configure Node.js path (cPanel doesn't have Node.js in PATH)
log "Step 0: Detecting Node.js installation..."
find_nodejs() {
    # Try common Node.js paths in cPanel
    local nodejs_paths=(
        "/usr/local/bin/node"
        "/usr/bin/node"
        "$HOME/.cpanel-nodejs-selector/nodejs-bin/20/bin/node"
        "$HOME/.cpanel-nodejs-selector/nodejs-bin/18/bin/node"
        "$(which node 2>/dev/null)"
    )
    
    # Check for Node.js via nodevenv directories
    if [ -d "$HOME/nodevenv" ]; then
        for dir in "$HOME/nodevenv"/*; do
            if [ -d "$dir" ] && [ -f "$dir/node" ]; then
                nodejs_paths+=("$dir/node")
            fi
        done
    fi
    
    # Try to find Node.js binary
    for path in "${nodejs_paths[@]}"; do
        if [ -n "$path" ] && [ -x "$path" ]; then
            NODEJS_BIN="$path"
            NPM_BIN="$(dirname "$path")/npm"
            if [ -x "$NPM_BIN" ]; then
                export PATH="$(dirname "$path"):$PATH"
                log "✅ Found Node.js at: $NODEJS_BIN"
                log "✅ Node.js version: $($NODEJS_BIN --version)"
                log "✅ npm version: $($NPM_BIN --version)"
                return 0
            fi
        fi
    done
    
    # Try loading Node.js from cPanel Node.js Selector environment
    if [ -f "$HOME/.cpanel-nodejs-selector/nodejs-bin/20/bin/node" ]; then
        export PATH="$HOME/.cpanel-nodejs-selector/nodejs-bin/20/bin:$PATH"
        NODEJS_BIN="$(which node)"
        NPM_BIN="$(which npm)"
        if [ -n "$NODEJS_BIN" ] && [ -n "$NPM_BIN" ]; then
            log "✅ Found Node.js via cPanel Node.js Selector"
            log "✅ Node.js version: $($NODEJS_BIN --version)"
            return 0
        fi
    fi
    
    error "Node.js not found. Please install Node.js via cPanel Node.js Selector or contact your hosting provider."
}

find_nodejs

log "========================================="
log "Starting Omni CRM Automatic Deployment"
log "========================================="
log "Working directory: $SCRIPT_DIR"

# Configuration - cPanel paths
CLIENT_DIR="${SCRIPT_DIR}/client"
SERVER_DIR="${SCRIPT_DIR}/server"
FRONTEND_DEPLOY_DIR="$HOME/public_html"
BACKEND_DEPLOY_DIR="$HOME/api"

# Step 1: Verify directories exist
log "Step 1: Verifying project structure..."
if [ ! -d "$CLIENT_DIR" ]; then
    error "Client directory not found: $CLIENT_DIR"
fi
if [ ! -d "$SERVER_DIR" ]; then
    error "Server directory not found: $SERVER_DIR"
fi

# Step 2: Install client dependencies (if not already installed)
log "Step 2: Installing client dependencies..."
if [ -d "$CLIENT_DIR/node_modules" ]; then
    info "Client node_modules exists, running npm ci..."
fi
cd "$CLIENT_DIR" || error "Failed to navigate to client directory"
npm ci --production=false || error "Failed to install client dependencies"
log "✅ Client dependencies installed"

# Step 3: Build client
log "Step 3: Building frontend..."
npm run build || error "Client build failed"
log "✅ Frontend build completed"

# Step 4: Deploy frontend to public_html
log "Step 4: Deploying frontend to public_html..."
if [ ! -d "$FRONTEND_DEPLOY_DIR" ]; then
    mkdir -p "$FRONTEND_DEPLOY_DIR" || error "Failed to create public_html directory"
fi

# Backup existing files (optional - comment out if not needed)
# if [ "$(ls -A $FRONTEND_DEPLOY_DIR 2>/dev/null)" ]; then
#     BACKUP_DIR="${FRONTEND_DEPLOY_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
#     log "Creating backup at: $BACKUP_DIR"
#     cp -r "$FRONTEND_DEPLOY_DIR" "$BACKUP_DIR" || warning "Backup failed"
# fi

# Copy frontend files
rsync -av --delete "$CLIENT_DIR/dist/" "$FRONTEND_DEPLOY_DIR/" || error "Failed to copy frontend files"

# Create .htaccess for React Router (if it doesn't exist)
if [ ! -f "$FRONTEND_DEPLOY_DIR/.htaccess" ]; then
    log "Creating .htaccess for React Router..."
    cat > "$FRONTEND_DEPLOY_DIR/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
    log "✅ .htaccess created"
fi

log "✅ Frontend deployed to: $FRONTEND_DEPLOY_DIR"

# Step 5: Install server dependencies
log "Step 5: Installing server dependencies..."
cd "$SERVER_DIR" || error "Failed to navigate to server directory"
npm ci --production || error "Failed to install server dependencies"
log "✅ Server dependencies installed"

# Step 6: Generate Prisma Client
log "Step 6: Generating Prisma Client..."
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate || error "Failed to generate Prisma Client"
    log "✅ Prisma Client generated"
else
    warning "Prisma schema not found, skipping Prisma generate"
fi

# Step 7: Build server
log "Step 7: Building backend..."
npm run build || error "Server build failed"
log "✅ Backend build completed"

# Step 8: Create backend directory if it doesn't exist
log "Step 8: Setting up backend directory..."
if [ ! -d "$BACKEND_DEPLOY_DIR" ]; then
    mkdir -p "$BACKEND_DEPLOY_DIR" || error "Failed to create backend directory"
fi

# Step 9: Deploy backend files
log "Step 9: Deploying backend files..."
# Copy built files
rsync -av --delete "$SERVER_DIR/dist/" "$BACKEND_DEPLOY_DIR/dist/" || error "Failed to copy backend dist"

# Copy necessary files
cp "$SERVER_DIR/package.json" "$BACKEND_DEPLOY_DIR/" || error "Failed to copy package.json"
cp -r "$SERVER_DIR/prisma" "$BACKEND_DEPLOY_DIR/" || error "Failed to copy prisma directory"

# Create uploads directory structure if it doesn't exist
mkdir -p "$BACKEND_DEPLOY_DIR/uploads/products"
mkdir -p "$BACKEND_DEPLOY_DIR/uploads/social"
mkdir -p "$BACKEND_DEPLOY_DIR/uploads/tasks"
mkdir -p "$BACKEND_DEPLOY_DIR/uploads/theme"

# Copy existing uploads if they exist (preserve data)
if [ -d "$SERVER_DIR/uploads" ]; then
    rsync -av "$SERVER_DIR/uploads/" "$BACKEND_DEPLOY_DIR/uploads/" || warning "Failed to sync uploads"
fi

log "✅ Backend deployed to: $BACKEND_DEPLOY_DIR"

# Step 10: Set proper permissions
log "Step 10: Setting file permissions..."
chmod -R 755 "$FRONTEND_DEPLOY_DIR" || warning "Failed to set frontend permissions"
chmod -R 755 "$BACKEND_DEPLOY_DIR" || warning "Failed to set backend permissions"
chmod -R 775 "$BACKEND_DEPLOY_DIR/uploads" || warning "Failed to set uploads permissions"
log "✅ Permissions set"

# Step 11: Note about Node.js app restart
log "Step 11: Node.js application management..."
info "Note: If you have a Node.js app configured in cPanel:"
info "1. Go to cPanel → Node.js Selector"
info "2. Make sure the app points to: $BACKEND_DEPLOY_DIR/dist/server.js"
info "3. Restart the application if needed"

log "========================================="
log "✅ Deployment completed successfully!"
log "========================================="
log ""
log "Frontend URL: https://paaera.com"
log "Backend directory: $BACKEND_DEPLOY_DIR"
log ""
log "Next steps:"
log "1. Verify frontend is accessible at https://paaera.com"
log "2. Configure Node.js app in cPanel (if not already done)"
log "3. Check application logs for any errors"
log ""
