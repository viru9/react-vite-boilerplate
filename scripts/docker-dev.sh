#!/bin/bash

# Frontend Docker Development Script
# This script ensures clean container startup with proper rebuild

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗ $1${NC}"
    exit 1
}

log "Starting Frontend Docker Development Environment"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
fi

# Step 1: Stop and remove existing containers
log "Stopping existing containers..."
if docker-compose ps -q | grep -q .; then
    docker-compose down
    success "Existing containers stopped"
else
    log "No existing containers to stop"
fi

# Step 2: Force rebuild without cache
log "Building fresh images (this may take a few minutes)..."
if docker-compose build --no-cache; then
    success "Images built successfully"
else
    error "Failed to build images"
fi

# Step 3: Start containers
log "Starting containers..."
if docker-compose up -d; then
    success "Containers started successfully"
else
    error "Failed to start containers"
fi

# Step 4: Wait for services to be ready
log "Waiting for Vite dev server to start..."
sleep 15

# Step 5: Check service health
log "Checking service status..."

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    success "Containers are running"
else
    error "Some containers failed to start"
fi

# Check frontend health
log "Testing frontend accessibility..."
for i in {1..30}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        success "Frontend is responding at http://localhost:5173"
        break
    fi
    if [ $i -eq 30 ]; then
        warning "Frontend accessibility check timed out, but containers are running"
        break
    fi
    sleep 2
done

# Show container logs for verification
log "Recent container logs:"
docker-compose logs --tail=10 frontend

# Show status
echo ""
log "=== Docker Development Environment Ready ==="
echo -e "${GREEN}Frontend App:${NC} http://localhost:5173"
echo -e "${GREEN}Hot Reload:${NC} Enabled"
echo ""
log "Useful commands:"
echo "  npm run docker:logs    - View logs"
echo "  npm run docker:down    - Stop containers"
echo "  docker-compose ps      - Check status"
