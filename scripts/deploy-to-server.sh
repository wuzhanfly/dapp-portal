#!/bin/bash

# Deploy to Server Script
# 部署到服务器 /home/ubuntu/zk_node

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST=""
SERVER_PATH="/home/ubuntu/zk_node"
SSH_KEY=""
IMAGE_NAME="zksync-portal-bsc"
IMAGE_TAG="latest"
EXPORT_DIR="./docker-exports"

show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST       Server hostname or IP (required)"
    echo "  -u, --user USER       SSH user (default: ubuntu)"
    echo "  -i, --identity FILE   SSH private key file (e.g., ~/zk_application.pem)"
    echo "  -p, --path PATH       Server path (default: /home/ubuntu/zk_node)"
    echo "  -t, --tag TAG         Docker image tag (default: latest)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -h 54.255.170.191 -i ~/zk_application.pem"
    echo "  $0 -h myserver.com -u admin -i ~/.ssh/id_rsa -p /opt/zk_node"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            SERVER_HOST="$2"
            shift 2
            ;;
        -u|--user)
            SERVER_USER="$2"
            shift 2
            ;;
        -i|--identity)
            SSH_KEY="$2"
            shift 2
            ;;
        -p|--path)
            SERVER_PATH="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --help)
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

if [ -z "$SERVER_HOST" ]; then
    print_error "Server host is required!"
    show_usage
    exit 1
fi

# Build SSH command options
SSH_OPTS=""
if [ -n "$SSH_KEY" ]; then
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key file not found: $SSH_KEY"
        exit 1
    fi
    SSH_OPTS="-i $SSH_KEY"
fi

TAR_FILE="$EXPORT_DIR/${IMAGE_NAME}-${IMAGE_TAG}.tar"

print_status "Deployment Configuration:"
echo "  • Server: ${SERVER_USER}@${SERVER_HOST}"
echo "  • Path: ${SERVER_PATH}"
echo "  • Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""

# Check if tar file exists
if [ ! -f "$TAR_FILE" ]; then
    print_error "Docker image file not found: $TAR_FILE"
    print_status "Please run: ./scripts/build-and-export.sh first"
    exit 1
fi

# Check SSH connection
print_status "Testing SSH connection..."
if ! ssh $SSH_OPTS -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_HOST}" "echo 'SSH OK'" > /dev/null 2>&1; then
    print_error "Cannot connect to server via SSH"
    print_status "Please check:"
    echo "  1. Server is accessible"
    echo "  2. SSH key is configured correctly"
    echo "  3. User has proper permissions"
    exit 1
fi
print_success "SSH connection OK"

# Create server directory
print_status "Creating server directory..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${SERVER_PATH}"

# Upload files
print_status "Uploading Docker image..."
scp $SSH_OPTS "$TAR_FILE" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

print_status "Uploading configuration files..."
scp $SSH_OPTS config.js "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
scp $SSH_OPTS docker-compose.bsc.yml "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
scp $SSH_OPTS .env.production "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
scp $SSH_OPTS nginx-rpc-proxy-fixed.conf "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

# Deploy on server
print_status "Deploying on server..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << EOF
set -e
cd ${SERVER_PATH}

echo "Loading Docker image..."
docker load -i ${IMAGE_NAME}-${IMAGE_TAG}.tar

echo "Stopping existing containers..."
docker-compose -f docker-compose.bsc.yml down 2>/dev/null || true

echo "Starting services..."
docker-compose -f docker-compose.bsc.yml up -d

echo "Waiting for services to start..."
sleep 5

echo "Checking container status..."
docker-compose -f docker-compose.bsc.yml ps
EOF

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Service URLs:"
    echo "  • Portal: http://${SERVER_HOST}"
    echo "  • Health: http://${SERVER_HOST}/health"
    echo ""
    print_status "Useful commands:"
    echo "  • View logs: ssh ${SERVER_USER}@${SERVER_HOST} 'cd ${SERVER_PATH} && docker-compose -f docker-compose.bsc.yml logs -f'"
    echo "  • Restart: ssh ${SERVER_USER}@${SERVER_HOST} 'cd ${SERVER_PATH} && docker-compose -f docker-compose.bsc.yml restart'"
    echo "  • Stop: ssh ${SERVER_USER}@${SERVER_HOST} 'cd ${SERVER_PATH} && docker-compose -f docker-compose.bsc.yml down'"
else
    print_error "Deployment failed!"
    exit 1
fi
