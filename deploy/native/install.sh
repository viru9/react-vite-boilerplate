#!/bin/bash

# Frontend Native Production Installation Script
# This script sets up the server environment for native frontend deployment

set -e

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

log "Starting frontend production environment setup"

# Update system packages
log "Updating system packages"
apt update && apt upgrade -y
success "System packages updated"

# Install Node.js (for building if needed)
log "Installing Node.js"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    success "Node.js installed: $(node --version)"
else
    log "Node.js already installed: $(node --version)"
fi

# Install Nginx
log "Installing Nginx"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    success "Nginx installed and started"
else
    log "Nginx already installed"
fi

# Install additional tools
log "Installing additional tools"
apt install -y curl wget git htop nano certbot python3-certbot-nginx unzip
success "Additional tools installed"

# Configure firewall
log "Configuring firewall"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow ssh
    ufw allow 'Nginx Full'
    success "Firewall configured"
else
    warning "UFW not available, skipping firewall configuration"
fi

# Create web root directory
log "Creating web root directory"
mkdir -p /var/www/frontend
chown -R www-data:www-data /var/www/frontend
chmod -R 755 /var/www/frontend
success "Web root directory created"

# Create backup directory
log "Creating backup directory"
mkdir -p /var/backups/frontend
chmod -R 755 /var/backups/frontend
success "Backup directory created"

# Remove default Nginx site
log "Configuring Nginx"
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    log "Removed default Nginx site"
fi

# Create custom Nginx configuration directory
mkdir -p /etc/nginx/conf.d/custom
success "Nginx configuration directories created"

# Optimize Nginx configuration
log "Optimizing Nginx configuration"
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

cat > /etc/nginx/conf.d/custom/performance.conf << 'EOF'
# Performance optimizations
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
types_hash_max_size 2048;
server_tokens off;

# Gzip configuration
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json
    image/svg+xml;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;

# Timeouts
client_body_timeout 60;
client_header_timeout 60;
send_timeout 60;

# Open file cache
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
EOF

cat > /etc/nginx/conf.d/custom/security.conf << 'EOF'
# Security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Hide Nginx version
server_tokens off;

# Limit request methods
add_header Allow "GET, POST, HEAD" always;
if ( $request_method !~ ^(GET|POST|HEAD)$ ) {
    return 405;
}
EOF

success "Nginx configuration optimized"

# Test Nginx configuration
if nginx -t; then
    systemctl reload nginx
    success "Nginx configuration tested and reloaded"
else
    error "Nginx configuration test failed"
fi

# Set up log rotation for custom logs
log "Setting up log rotation"
cat > /etc/logrotate.d/frontend << 'EOF'
/var/log/nginx/frontend*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF
success "Log rotation configured"

# Create deployment user
log "Creating deployment user"
if ! id "deploy" >/dev/null 2>&1; then
    useradd --system --shell /bin/bash --home-dir /home/deploy --create-home deploy
    usermod -aG www-data deploy
    success "Created deployment user: deploy"
else
    log "Deployment user already exists"
fi

# Set up deployment directory permissions
log "Setting up deployment permissions"
mkdir -p /home/deploy
chown deploy:deploy /home/deploy
chmod 755 /home/deploy

# Allow deploy user to restart nginx
echo "deploy ALL=(root) NOPASSWD: /bin/systemctl reload nginx, /bin/systemctl restart nginx, /usr/sbin/nginx -t" > /etc/sudoers.d/deploy-nginx
success "Deployment permissions configured"

# Create health check script
log "Creating health check script"
cat > /usr/local/bin/frontend-health-check << 'EOF'
#!/bin/bash
# Frontend health check script

HEALTH_URL="http://localhost/"
TIMEOUT=10

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "CRITICAL: Nginx is not running"
    exit 2
fi

# Check if site responds
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$HEALTH_URL" || echo "000")

case $HTTP_CODE in
    200)
        echo "OK: Frontend is responding (HTTP 200)"
        exit 0
        ;;
    000)
        echo "CRITICAL: Could not connect to frontend"
        exit 2
        ;;
    *)
        echo "WARNING: Frontend responded with HTTP $HTTP_CODE"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/frontend-health-check
success "Health check script created"

# Create monitoring cron job
log "Setting up monitoring"
echo "*/5 * * * * root /usr/local/bin/frontend-health-check >> /var/log/frontend-health.log 2>&1" > /etc/cron.d/frontend-health
success "Health monitoring configured"

# Create SSL setup script
log "Creating SSL setup script"
cat > /usr/local/bin/setup-ssl << 'EOF'
#!/bin/bash
# SSL certificate setup script
# Usage: setup-ssl your-domain.com

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 your-domain.com"
    exit 1
fi

echo "Setting up SSL certificate for $DOMAIN"

# Get certificate
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"

# Set up auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

echo "SSL certificate setup completed for $DOMAIN"
echo "Auto-renewal is configured via systemd timer"
EOF

chmod +x /usr/local/bin/setup-ssl
success "SSL setup script created"

success "Frontend production environment setup completed!"
echo ""
log "Next steps:"
echo "1. Copy your nginx.conf to /etc/nginx/sites-available/frontend"
echo "2. Enable the site: ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/"
echo "3. Update nginx.conf with your domain name"
echo "4. Test nginx config: nginx -t"
echo "5. Reload nginx: systemctl reload nginx"
echo "6. Set up SSL: /usr/local/bin/setup-ssl your-domain.com"
echo "7. Deploy your application: ./deploy.sh"
echo ""
warning "Remember to:"
echo "- Update domain names in Nginx configuration"
echo "- Configure proper SSL certificates"
echo "- Set up monitoring and alerting"
echo "- Configure backups"
echo "- Update firewall rules as needed"
