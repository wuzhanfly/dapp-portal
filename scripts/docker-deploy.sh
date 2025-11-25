#!/bin/bash

# zkSync Portal Docker Deployment Script
# Usage: ./scripts/docker-deploy.sh [environment] [action]
# Environments: dev, prod, bsc
# Actions: up, down, restart, logs, build

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
ACTION=${2:-up}

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
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  dev     - Development environment (default)"
    echo "  prod    - Production environment (zkSync Era)"
    echo "  bsc     - BSC Hyperchain environment"
    echo ""
    echo "Actions:"
    echo "  up      - Start services (default)"
    echo "  down    - Stop and remove services"
    echo "  restart - Restart services"
    echo "  logs    - Show service logs"
    echo "  build   - Build images"
    echo "  status  - Show service status"
    echo ""
    echo "Examples:"
    echo "  $0 bsc up          # Start BSC hyperchain"
    echo "  $0 prod restart    # Restart production"
    echo "  $0 dev logs        # Show development logs"
}

# Function to get compose file based on environment
get_compose_file() {
    case $ENVIRONMENT in
        dev)
            echo "docker-compose.yml"
            ;;
        prod)
            echo "docker-compose.prod.yml"
            ;;
        bsc)
            echo "docker-compose.bsc.yml"
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            show_usage
            exit 1
            ;;
    esac
}

# Function to execute docker-compose command
execute_compose() {
    local compose_file=$(get_compose_file)
    local cmd="docker-compose -f $compose_file $@"
    
    print_status "Executing: $cmd"
    eval $cmd
}

# Main execution
main() {
    # Check if help is requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "docker-compose is not installed. Please install it first."
        exit 1
    fi

    print_status "Environment: $ENVIRONMENT"
    print_status "Action: $ACTION"

    case $ACTION in
        up)
            print_status "Starting $ENVIRONMENT environment..."
            execute_compose up --build -d
            print_success "$ENVIRONMENT environment started successfully!"
            print_status "Access the portal at: http://localhost:3000"
            ;;
        down)
            print_status "Stopping $ENVIRONMENT environment..."
            execute_compose down
            print_success "$ENVIRONMENT environment stopped successfully!"
            ;;
        restart)
            print_status "Restarting $ENVIRONMENT environment..."
            execute_compose restart
            print_success "$ENVIRONMENT environment restarted successfully!"
            ;;
        logs)
            print_status "Showing logs for $ENVIRONMENT environment..."
            execute_compose logs -f
            ;;
        build)
            print_status "Building images for $ENVIRONMENT environment..."
            execute_compose build --no-cache
            print_success "Images built successfully!"
            ;;
        status)
            print_status "Status of $ENVIRONMENT environment:"
            execute_compose ps
            ;;
        *)
            print_error "Unknown action: $ACTION"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"