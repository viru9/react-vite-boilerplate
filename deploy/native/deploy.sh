#!/bin/bash

# Frontend Native Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

# Default environment
ENVIRONMENT=${1:-production}

# Configuration
APP_NAME="frontend-app"
WEB_ROOT="/var/www/frontend"
NGINX_SITE_NAME="frontend"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
BACKUP_DIR="/var/backups/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID != 0 ]]; then
    error "This script must be run as root (use sudo)"
fi

log "Starting frontend deployment for environment: $ENVIRONMENT"

# Check if build exists
if [ ! -d "dist" ]; then
    error "Build directory 'dist' not found. Run 'npm run build' first."
fi

# Create backup of current deployment
if [ -d "$WEB_ROOT" ]; then
    BACKUP_NAME="frontend-backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    log "Creating backup: $BACKUP_PATH"
    mkdir -p "$BACKUP_DIR"
    cp -r "$WEB_ROOT" "$BACKUP_PATH"
    success "Created backup"
fi

# Create web root directory
log "Setting up web root directory: $WEB_ROOT"
mkdir -p "$WEB_ROOT"

# Deploy new build
log "Deploying new build"
rm -rf "$WEB_ROOT"/*
cp -r dist/* "$WEB_ROOT/"
success "Deployed build files"

# Set proper permissions
log "Setting file permissions"
chown -R www-data:www-data "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 755 {} \;
find "$WEB_ROOT" -type f -exec chmod 644 {} \;
success "Set file permissions"

# Install/Update Nginx configuration
log "Installing Nginx configuration"
if [ -f "nginx.conf" ]; then
    cp "nginx.conf" "$NGINX_SITES_AVAILABLE/$NGINX_SITE_NAME"
    
    # Enable site if not already enabled
    if [ ! -L "$NGINX_SITES_ENABLED/$NGINX_SITE_NAME" ]; then
        ln -s "$NGINX_SITES_AVAILABLE/$NGINX_SITE_NAME" "$NGINX_SITES_ENABLED/"
        success "Enabled Nginx site"
    else
        log "Nginx site already enabled"
    fi
    
    # Test Nginx configuration
    if nginx -t; then
        systemctl reload nginx
        success "Nginx configuration updated and reloaded"
    else
        error "Nginx configuration test failed"
    fi
else
    warning "Nginx configuration file not found, skipping Nginx setup"
fi

# Verify deployment
log "Verifying deployment"
if [ -f "$WEB_ROOT/index.html" ]; then
    success "index.html found in web root"
else
    error "index.html not found in web root"
fi

# Check if Nginx is serving the site
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    success "Frontend is responding (HTTP 200)"
elif [ "$HTTP_STATUS" = "000" ]; then
    warning "Could not connect to localhost (Nginx might not be running)"
else
    warning "Frontend responded with HTTP $HTTP_STATUS"
fi

# Generate deployment report
DEPLOYMENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
DEPLOYMENT_REPORT="$WEB_ROOT/deployment-info.json"
cat > "$DEPLOYMENT_REPORT" << EOF
{
    "deploymentTime": "$DEPLOYMENT_TIME",
    "environment": "$ENVIRONMENT",
    "buildInfo": {
        "buildTime": "$(date -r dist/index.html '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'unknown')",
        "filesCount": $(find dist -type f | wc -l)
    },
    "server": {
        "hostname": "$(hostname)",
        "user": "$(whoami)"
    }
}
EOF

# Clean up old backups (keep last 10)
log "Cleaning up old backups"
if [ -d "$BACKUP_DIR" ]; then
    cd "$BACKUP_DIR"
    ls -1t | tail -n +11 | xargs -r rm -rf
    BACKUP_COUNT=$(ls -1 | wc -l)
    success "Cleaned up old backups (keeping $BACKUP_COUNT recent backups)"
fi

success "Frontend deployment completed successfully!"
echo ""
log "Deployment Summary:"
echo "- Environment: $ENVIRONMENT"
echo "- Web Root: $WEB_ROOT"
echo "- Deployment Time: $DEPLOYMENT_TIME"
echo "- Backup Available: $BACKUP_PATH"
echo ""
log "Useful commands:"
echo "- Check Nginx status: systemctl status nginx"
echo "- View Nginx logs: tail -f /var/log/nginx/access.log"
echo "- Test site: curl -I http://localhost/"
echo "- View deployment info: cat $DEPLOYMENT_REPORT"
