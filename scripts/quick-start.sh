#!/bin/bash

# zkSync Portal Quick Start Script
# This script helps you get started with Docker deployment quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  zkSync Portal Quick Start${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo ""
}

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker > /dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "All prerequisites are met!"
}

# Function to show environment selection
select_environment() {
    echo ""
    print_status "Please select your deployment environment:"
    echo ""
    echo "1) BSC Hyperchain (Recommended for BSC zkStack)"
    echo "2) Development (Local development and testing)"
    echo "3) Production (zkSync Era mainnet)"
    echo ""
    
    while true; do
        read -p "Enter your choice (1-3): " choice
        case $choice in
            1)
                ENVIRONMENT="bsc"
                DESCRIPTION="BSC Hyperchain"
                PORT="3000"
                break
                ;;
            2)
                ENVIRONMENT="dev"
                DESCRIPTION="Development"
                PORT="3000"
                break
                ;;
            3)
                ENVIRONMENT="prod"
                DESCRIPTION="Production"
                PORT="3001"
                break
                ;;
            *)
                print_warning "Please enter a valid choice (1-3)"
                ;;
        esac
    done
    
    print_success "Selected environment: $DESCRIPTION"
}

# Function to check port availability
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $PORT is already in use."
        read -p "Do you want to continue anyway? (y/N): " continue_choice
        if [[ ! $continue_choice =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    else
        print_success "Port $PORT is available."
    fi
}

# Function to deploy the application
deploy_application() {
    print_status "Starting deployment of $DESCRIPTION environment..."
    
    # Make sure the deploy script is executable
    chmod +x scripts/docker-deploy.sh
    
    # Deploy using the script
    ./scripts/docker-deploy.sh $ENVIRONMENT up
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully!"
    else
        print_error "Deployment failed. Please check the logs."
        exit 1
    fi
}

# Function to show post-deployment information
show_post_deployment_info() {
    echo ""
    print_success "🎉 zkSync Portal is now running!"
    echo ""
    print_status "Access Information:"
    echo "  • Portal URL: http://localhost:$PORT"
    echo "  • Health Check: http://localhost:$PORT/health"
    echo ""
    print_status "Management Commands:"
    echo "  • View logs: make logs-$ENVIRONMENT"
    echo "  • Stop service: make down-$ENVIRONMENT"
    echo "  • Restart service: make restart-$ENVIRONMENT"
    echo "  • View status: make status"
    echo ""
    print_status "Alternative commands:"
    echo "  • View logs: ./scripts/docker-deploy.sh $ENVIRONMENT logs"
    echo "  • Stop service: ./scripts/docker-deploy.sh $ENVIRONMENT down"
    echo "  • Restart service: ./scripts/docker-deploy.sh $ENVIRONMENT restart"
    echo ""
    
    if [ "$ENVIRONMENT" = "bsc" ]; then
        print_status "BSC Hyperchain Configuration:"
        echo "  • L1 Network: BSC Testnet (Chain ID: 97)"
        echo "  • L2 Network: ZK BSC Chain (Chain ID: 9720)"
        echo "  • Mode: Hyperchain"
    fi
    
    echo ""
    print_warning "Note: It may take a few moments for the service to be fully ready."
    print_status "You can check the logs with: make logs-$ENVIRONMENT"
}

# Function to test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait a moment for the service to start
    sleep 5
    
    # Test health endpoint
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. The service might still be starting up."
        print_status "You can check the status with: make logs-$ENVIRONMENT"
    fi
}

# Main execution
main() {
    print_header
    
    check_prerequisites
    select_environment
    check_port
    deploy_application
    test_deployment
    show_post_deployment_info
    
    echo ""
    print_success "Quick start completed! Enjoy using zkSync Portal! 🚀"
}

# Run main function
main "$@"