#!/bin/sh

# Docker entrypoint script for React frontend with Nginx

set -e

# Default values
NGINX_HOST=${NGINX_HOST:-localhost}
BACKEND_HOST=${BACKEND_HOST:-localhost}
BACKEND_PORT=${BACKEND_PORT:-8000}

echo "Starting Frontend Docker Container..."
echo "NGINX_HOST: $NGINX_HOST"
echo "BACKEND_HOST: $BACKEND_HOST"
echo "BACKEND_PORT: $BACKEND_PORT"

# Replace environment variables in nginx configuration
echo "Configuring Nginx..."

# Process default.conf
envsubst '${NGINX_HOST} ${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

# Process SSL configuration if certificates exist
if [ -f "/etc/nginx/ssl/fullchain.pem" ] && [ -f "/etc/nginx/ssl/privkey.pem" ]; then
    echo "SSL certificates found, enabling HTTPS..."
    
    # Extract location blocks for SSL config
    sed -n '/location/,/^[[:space:]]*}/p' /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/locations.conf
    
    # Process SSL template
    envsubst '${NGINX_HOST}' < /etc/nginx/conf.d/ssl.conf.template > /etc/nginx/conf.d/ssl.conf
    
    # Uncomment SSL configuration
    sed -i 's/^# //g' /etc/nginx/conf.d/ssl.conf
else
    echo "No SSL certificates found, running HTTP only..."
    echo "To enable HTTPS:"
    echo "1. Mount SSL certificates to /etc/nginx/ssl/"
    echo "2. Restart the container"
fi

# Create log directories if they don't exist
mkdir -p /var/log/nginx
touch /var/log/nginx/access.log
touch /var/log/nginx/error.log

# Set proper permissions
chown -R nginx:nginx /var/log/nginx
chown -R nginx:nginx /var/cache/nginx

# Generate build info
BUILD_TIME=$(date -Iseconds)
cat > /usr/share/nginx/html/build-info.json << EOF
{
    "buildTime": "$BUILD_TIME",
    "environment": "production",
    "version": "1.0.0",
    "nginx": {
        "host": "$NGINX_HOST",
        "backend": "$BACKEND_HOST:$BACKEND_PORT"
    }
}
EOF

# Update health check with current timestamp
cat > /usr/share/nginx/html/health.json << EOF
{
    "status": "ok",
    "timestamp": "$(date -Iseconds)",
    "version": "1.0.0",
    "uptime": "$(uptime -p 2>/dev/null || echo 'unknown')"
}
EOF

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
else
    echo "Nginx configuration test failed!"
    exit 1
fi

# Create a startup script for ongoing health updates
cat > /usr/local/bin/update-health.sh << 'EOF'
#!/bin/sh
while true; do
    sleep 30
    cat > /usr/share/nginx/html/health.json << HEALTH_EOF
{
    "status": "ok",
    "timestamp": "$(date -Iseconds)",
    "version": "1.0.0",
    "uptime": "$(uptime -p 2>/dev/null || echo 'unknown')"
}
HEALTH_EOF
done
EOF

chmod +x /usr/local/bin/update-health.sh

# Start health updater in background
/usr/local/bin/update-health.sh &

# Print startup information
echo "Frontend container ready!"
echo "- Web root: /usr/share/nginx/html"
echo "- Config: /etc/nginx/nginx.conf"
echo "- Health check: http://localhost/health"
echo "- Build info: http://localhost/build-info.json"

# Start Nginx in foreground
echo "Starting Nginx..."
exec "$@"
