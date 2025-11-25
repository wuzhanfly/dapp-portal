#!/bin/bash

# zkSync Portal Docker Build and Export Script
# 本地构建 Docker 镜像并导出为 tar 文件

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
EXPORT_DIR="./docker-exports"
EXPORT_FILE="$EXPORT_DIR/${IMAGE_NAME}-${IMAGE_TAG}.tar"

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
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -t, --tag TAG     Docker image tag (default: latest)"
    echo "  -o, --output DIR  Output directory (default: ./docker-exports)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Build with default settings"
    echo "  $0 -t v1.0.0                # Build with custom tag"
    echo "  $0 -o /tmp/exports           # Custom output directory"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -o|--output)
            EXPORT_DIR="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Update export file path with new tag
EXPORT_FILE="$EXPORT_DIR/${IMAGE_NAME}-${IMAGE_TAG}.tar"

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker > /dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to create export directory
create_export_dir() {
    print_status "Creating export directory: $EXPORT_DIR"
    mkdir -p "$EXPORT_DIR"
    print_success "Export directory created!"
}

# Function to build Docker image
build_image() {
    print_status "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
    print_status "Using Dockerfile.bsc for BSC Hyperchain build..."
    
    # Build the image
    docker build -f Dockerfile.bsc -t "${IMAGE_NAME}:${IMAGE_TAG}" .
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built successfully!"
    else
        print_error "Docker image build failed!"
        exit 1
    fi
}

# Function to export Docker image
export_image() {
    print_status "Exporting Docker image to: $EXPORT_FILE"
    
    # Remove existing export file if it exists
    if [ -f "$EXPORT_FILE" ]; then
        print_warning "Removing existing export file..."
        rm "$EXPORT_FILE"
    fi
    
    # Export the image
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" -o "$EXPORT_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Docker image exported successfully!"
        
        # Show file size
        FILE_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
        print_status "Export file size: $FILE_SIZE"
    else
        print_error "Docker image export failed!"
        exit 1
    fi
}

# Function to create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    PACKAGE_DIR="$EXPORT_DIR/deployment-package"
    mkdir -p "$PACKAGE_DIR"
    
    # Copy necessary files
    cp "$EXPORT_FILE" "$PACKAGE_DIR/"
    cp .env.production "$PACKAGE_DIR/"
    cp -r docker/ "$PACKAGE_DIR/" 2>/dev/null || true
    
    # Create deployment-specific docker-compose file (without build section)
    cat > "$PACKAGE_DIR/docker-compose.bsc.yml" << EOF
services:
  zksync-portal-bsc:
    image: ${IMAGE_NAME}:${IMAGE_TAG}
    container_name: zksync-portal-bsc
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NODE_TYPE=hyperchain
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.zksync-portal.rule=Host(\`portal.yourdomain.com\`)"
      - "traefik.http.routers.zksync-portal.tls=true"
      - "traefik.http.routers.zksync-portal.tls.certresolver=letsencrypt"
      - "traefik.http.services.zksync-portal.loadbalancer.server.port=3000"
    networks:
      - zksync-network

networks:
  zksync-network:
    driver: bridge
EOF
    
    # Create deployment script for server
    cat > "$PACKAGE_DIR/deploy-on-server.sh" << 'EOF'
#!/bin/bash

# Server Deployment Script
# Run this script on your server to deploy the zkSync Portal

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

IMAGE_NAME="zksync-portal-bsc"
IMAGE_TAG="latest"
TAR_FILE="${IMAGE_NAME}-${IMAGE_TAG}.tar"

print_status "Starting server deployment..."

# Check if Docker is installed
if ! command -v docker > /dev/null 2>&1; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Load Docker image
if [ -f "$TAR_FILE" ]; then
    print_status "Loading Docker image from $TAR_FILE..."
    docker load -i "$TAR_FILE"
    print_success "Docker image loaded successfully!"
else
    print_error "Docker image file $TAR_FILE not found!"
    exit 1
fi

# Stop existing container if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.bsc.yml down 2>/dev/null || true

# Start the service
print_status "Starting zkSync Portal service..."
docker-compose -f docker-compose.bsc.yml up -d

if [ $? -eq 0 ]; then
    print_success "zkSync Portal deployed successfully!"
    print_status "Access the portal at: http://localhost:3000"
    print_status "Health check: http://localhost:3000/health"
    
    # Show container status
    echo ""
    print_status "Container status:"
    docker-compose -f docker-compose.bsc.yml ps
    
    echo ""
    print_status "To view logs: docker-compose -f docker-compose.bsc.yml logs -f"
    print_status "To stop service: docker-compose -f docker-compose.bsc.yml down"
else
    print_error "Deployment failed!"
    exit 1
fi
EOF
    
    chmod +x "$PACKAGE_DIR/deploy-on-server.sh"
    
    # Create README for deployment
    cat > "$PACKAGE_DIR/README.md" << EOF
# zkSync Portal Deployment Package

## Files in this package:
- \`${IMAGE_NAME}-${IMAGE_TAG}.tar\` - Docker image file
- \`docker-compose.bsc.yml\` - Docker Compose configuration
- \`.env.production\` - Environment variables
- \`docker/\` - Nginx configuration (if exists)
- \`deploy-on-server.sh\` - Server deployment script

## Deployment Instructions:

1. Upload this entire folder to your server
2. Run the deployment script:
   \`\`\`bash
   chmod +x deploy-on-server.sh
   ./deploy-on-server.sh
   \`\`\`

## Manual Deployment:

1. Load the Docker image:
   \`\`\`bash
   docker load -i ${IMAGE_NAME}-${IMAGE_TAG}.tar
   \`\`\`

2. Start the service:
   \`\`\`bash
   docker-compose -f docker-compose.bsc.yml up -d
   \`\`\`

## Access:
- Portal: http://localhost:3000
- Health Check: http://localhost:3000/health

## Management:
- View logs: \`docker-compose -f docker-compose.bsc.yml logs -f\`
- Stop service: \`docker-compose -f docker-compose.bsc.yml down\`
- Restart service: \`docker-compose -f docker-compose.bsc.yml restart\`
EOF
    
    # Create archive
    ARCHIVE_NAME="zksync-portal-deployment-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$EXPORT_DIR/$ARCHIVE_NAME" -C "$EXPORT_DIR" deployment-package
    
    print_success "Deployment package created: $EXPORT_DIR/$ARCHIVE_NAME"
    
    # Cleanup temporary directory
    rm -rf "$PACKAGE_DIR"
}

# Function to show summary
show_summary() {
    echo ""
    print_success "🎉 Build and export completed successfully!"
    echo ""
    print_status "Generated files:"
    echo "  • Docker image: $EXPORT_FILE"
    echo "  • Deployment package: $EXPORT_DIR/zksync-portal-deployment-*.tar.gz"
    echo ""
    print_status "Next steps:"
    echo "  1. Upload the deployment package to your server"
    echo "  2. Extract and run: tar -xzf zksync-portal-deployment-*.tar.gz"
    echo "  3. cd deployment-package && ./deploy-on-server.sh"
    echo ""
    print_status "Or manually:"
    echo "  1. Upload $EXPORT_FILE to server"
    echo "  2. docker load -i $(basename $EXPORT_FILE)"
    echo "  3. docker-compose -f docker-compose.bsc.yml up -d"
}

# Main execution
main() {
    echo "🐳 zkSync Portal Docker Build and Export"
    echo "========================================"
    echo ""
    
    print_status "Configuration:"
    echo "  • Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "  • Export directory: $EXPORT_DIR"
    echo "  • Export file: $EXPORT_FILE"
    echo ""
    
    check_prerequisites
    create_export_dir
    build_image
    export_image
    create_deployment_package
    show_summary
}

# Run main function
main "$@"