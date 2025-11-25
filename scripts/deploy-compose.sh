#!/bin/bash

# ZKsync Portal BSC Docker Compose Deployment Script
set -e

echo "🚀 Starting ZKsync Portal BSC Deployment with Docker Compose..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Use docker-compose or docker compose based on availability
DOCKER_COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
fi

# Stop existing services
log_info "Stopping existing services..."
$DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml down

# Build and start services
log_info "Building and starting services..."
$DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml up --build -d

if [ $? -eq 0 ]; then
    log_success "Services started successfully"
else
    log_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 15

# Health check
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Application is healthy and ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Application failed to start properly"
        $DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml logs
        exit 1
    fi
    sleep 2
done

# Display deployment info
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Information:"
echo "  • Service: zksync-portal-bsc"
echo "  • Port: 3000"
echo "  • URL: http://localhost:3000"
echo ""
echo "🔧 Useful Commands:"
echo "  • View logs: $DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml logs -f"
echo "  • Stop services: $DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml down"
echo "  • Restart services: $DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml restart"
echo "  • View status: $DOCKER_COMPOSE_CMD -f docker-compose.bsc.yml ps"
echo ""
echo "🌐 Access your ZKsync Portal at: http://localhost:3000"