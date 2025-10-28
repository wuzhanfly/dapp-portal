#!/bin/bash

# ZKsync Portal BSC Deployment Script
set -e

echo "🚀 Starting ZKsync Portal BSC Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="zksync-portal-bsc"
CONTAINER_NAME="zksync-portal-bsc"
PORT=${PORT:-3000}
DOMAIN=${DOMAIN:-"localhost"}

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop and remove existing container
log_info "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Remove old image
log_info "Removing old image..."
docker rmi $IMAGE_NAME 2>/dev/null || true

# Build new image
log_info "Building Docker image..."
docker build -f Dockerfile.bsc -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    log_success "Docker image built successfully"
else
    log_error "Failed to build Docker image"
    exit 1
fi

# Run container
log_info "Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:3000 \
    -e NODE_ENV=production \
    -e NODE_TYPE=hyperchain \
    --env-file .env.production \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    log_success "Container started successfully"
else
    log_error "Failed to start container"
    exit 1
fi

# Wait for container to be ready
log_info "Waiting for application to start..."
sleep 10

# Health check
for i in {1..30}; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        log_success "Application is healthy and ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Application failed to start properly"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    sleep 2
done

# Display deployment info
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Information:"
echo "  • Container Name: $CONTAINER_NAME"
echo "  • Image: $IMAGE_NAME"
echo "  • Port: $PORT"
echo "  • URL: http://$DOMAIN:$PORT"
echo ""
echo "🔧 Useful Commands:"
echo "  • View logs: docker logs -f $CONTAINER_NAME"
echo "  • Stop container: docker stop $CONTAINER_NAME"
echo "  • Restart container: docker restart $CONTAINER_NAME"
echo "  • Remove container: docker rm -f $CONTAINER_NAME"
echo ""
echo "🌐 Access your ZKsync Portal at: http://$DOMAIN:$PORT"