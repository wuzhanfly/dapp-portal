#!/bin/bash

# zkSync Portal Server Deployment Script
# 在服务器上运行此脚本来部署 zkSync Portal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="zksync-portal-bsc"
IMAGE_TAG="latest"
CONTAINER_NAME="zksync-portal-bsc"
COMPOSE_FILE="docker-compose.bsc.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options] <docker-image-file>"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE       Docker image tar file"
    echo "  -t, --tag TAG         Docker image tag (default: latest)"
    echo "  --no-load            Skip loading Docker image (use existing)"
    echo "  --stop-only          Only stop the service"
    echo "  --start-only         Only start the service (skip image loading)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 zksync-portal-bsc-latest.tar    # Load image and deploy"
    echo "  $0 --start-only                    # Start with existing image"
    echo "  $0 --stop-only                     # Stop the service"
}

# Default values
DOCKER_FILE=""
SKIP_LOAD=false
STOP_ONLY=false
START_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            DOCKER_FILE="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --no-load)
            SKIP_LOAD=true
            shift
            ;;
        --stop-only)
            STOP_ONLY=true
            shift
            ;;
        --start-only)
            START_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$DOCKER_FILE" ]; then
                DOCKER_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker > /dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Install command: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Install command: sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "Then: sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        echo "Start command: sudo systemctl start docker"
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to stop existing service
stop_service() {
    print_status "Stopping existing zkSync Portal service..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
        print_success "Service stopped using Docker Compose"
    else
        # Fallback to direct container management
        if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
            docker stop "$CONTAINER_NAME" 2>/dev/null || true
            docker rm "$CONTAINER_NAME" 2>/dev/null || true
            print_success "Container stopped and removed"
        else
            print_status "No running container found"
        fi
    fi
}

# Function to load Docker image
load_image() {
    if [ "$SKIP_LOAD" = true ] || [ "$START_ONLY" = true ]; then
        print_status "Skipping image loading..."
        return
    fi
    
    if [ -z "$DOCKER_FILE" ]; then
        print_error "Docker image file not specified!"
        show_usage
        exit 1
    fi
    
    if [ ! -f "$DOCKER_FILE" ]; then
        print_error "Docker image file not found: $DOCKER_FILE"
        exit 1
    fi
    
    print_status "Loading Docker image from: $DOCKER_FILE"
    
    # Load the image
    docker load -i "$DOCKER_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Docker image loaded successfully!"
        
        # Show loaded images
        print_status "Available images:"
        docker images | grep "$IMAGE_NAME" || docker images | head -5
    else
        print_error "Failed to load Docker image!"
        exit 1
    fi
}

# Function to start service
start_service() {
    if [ "$STOP_ONLY" = true ]; then
        return
    fi
    
    print_status "Starting zkSync Portal service..."
    
    # Check if compose file exists
    if [ -f "$COMPOSE_FILE" ]; then
        print_status "Using Docker Compose configuration: $COMPOSE_FILE"
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        print_warning "Docker Compose file not found, using direct container run..."
        
        # Fallback to direct container run
        docker run -d \
            --name "$CONTAINER_NAME" \
            --restart unless-stopped \
            -p 3000:3000 \
            -e NODE_ENV=production \
            -e NODE_TYPE=hyperchain \
            "${IMAGE_NAME}:${IMAGE_TAG}"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "zkSync Portal started successfully!"
    else
        print_error "Failed to start zkSync Portal!"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    if [ "$STOP_ONLY" = true ]; then
        return
    fi
    
    print_status "Verifying deployment..."
    
    # Wait a moment for the service to start
    sleep 5
    
    # Check container status
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_success "Container is running!"
    else
        print_error "Container is not running!"
        print_status "Checking container logs..."
        docker logs "$CONTAINER_NAME" --tail 20
        exit 1
    fi
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    for i in {1..10}; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            print_success "Health check passed!"
            break
        else
            if [ $i -eq 10 ]; then
                print_warning "Health check failed after 10 attempts"
                print_status "Service might still be starting up..."
            else
                print_status "Waiting for service to be ready... ($i/10)"
                sleep 3
            fi
        fi
    done
}

# Function to show service status
show_status() {
    echo ""
    print_status "Service Status:"
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" ps
    else
        docker ps | grep "$CONTAINER_NAME" || echo "Container not found"
    fi
    
    echo ""
    print_status "Access Information:"
    echo "  • Portal URL: http://localhost:3000"
    echo "  • Health Check: http://localhost:3000/health"
    echo "  • Server IP: http://$(hostname -I | awk '{print $1}'):3000"
    
    echo ""
    print_status "Management Commands:"
    if [ -f "$COMPOSE_FILE" ]; then
        echo "  • View logs: docker-compose -f $COMPOSE_FILE logs -f"
        echo "  • Stop service: docker-compose -f $COMPOSE_FILE down"
        echo "  • Restart service: docker-compose -f $COMPOSE_FILE restart"
    else
        echo "  • View logs: docker logs -f $CONTAINER_NAME"
        echo "  • Stop service: docker stop $CONTAINER_NAME"
        echo "  • Restart service: docker restart $CONTAINER_NAME"
    fi
}

# Function to show logs
show_recent_logs() {
    echo ""
    print_status "Recent logs (last 20 lines):"
    echo "----------------------------------------"
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" logs --tail 20
    else
        docker logs "$CONTAINER_NAME" --tail 20 2>/dev/null || echo "No logs available"
    fi
}

# Main execution
main() {
    echo "🚀 zkSync Portal Server Deployment"
    echo "=================================="
    echo ""
    
    if [ "$STOP_ONLY" = true ]; then
        print_status "Stopping service only..."
        check_prerequisites
        stop_service
        print_success "Service stopped successfully!"
        return
    fi
    
    print_status "Configuration:"
    echo "  • Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "  • Container: $CONTAINER_NAME"
    echo "  • Compose file: $COMPOSE_FILE"
    if [ -n "$DOCKER_FILE" ]; then
        echo "  • Docker file: $DOCKER_FILE"
    fi
    echo ""
    
    check_prerequisites
    stop_service
    load_image
    start_service
    verify_deployment
    show_status
    show_recent_logs
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"