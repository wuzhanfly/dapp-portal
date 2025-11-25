#!/bin/bash

# zkSync Portal BSC with Nginx and HTTPS Deployment Script
# 在服务器上运行此脚本来部署带有 Nginx 反向代理和 HTTPS 的 zkSync Portal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
EMAIL=""
STAGING=true  # Set to false for production certificates

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
    echo "Usage: $0 -d <domain> -e <email> [-p]"
    echo ""
    echo "Options:"
    echo "  -d, --domain DOMAIN    Your domain name (e.g., portal.example.com)"
    echo "  -e, --email EMAIL      Your email for Let's Encrypt"
    echo "  -p, --production       Use production certificates (default: staging)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -d portal.example.com -e admin@example.com"
    echo "  $0 -d portal.example.com -e admin@example.com -p"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -p|--production)
            STAGING=false
            shift
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

# Validate required parameters
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
    print_error "Domain and email are required!"
    show_usage
    exit 1
fi

print_status "🚀 Starting zkSync Portal BSC deployment with Nginx and HTTPS"
print_status "Domain: $DOMAIN"
print_status "Email: $EMAIL"
print_status "Certificate mode: $([ "$STAGING" = true ] && echo "Staging" || echo "Production")"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker > /dev/null 2>&1; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Prerequisites check passed!"

# Create directory structure
print_status "Creating directory structure..."
mkdir -p nginx/{conf.d,logs,webroot}

# Load Docker image if exists
if [ -f "zksync-portal-bsc-latest.tar" ]; then
    print_status "Loading zkSync Portal Docker image..."
    docker load -i zksync-portal-bsc-latest.tar
    print_success "Docker image loaded successfully!"
else
    print_warning "Docker image file not found. Make sure zksync-portal-bsc:latest is available."
fi

# Copy Nginx configuration files
print_status "Setting up Nginx configuration..."

# Copy main nginx.conf
if [ -f "nginx-configs/nginx.conf" ]; then
    cp nginx-configs/nginx.conf nginx/nginx.conf
else
    print_error "nginx.conf not found in nginx-configs/"
    exit 1
fi

# Copy and customize default.conf
if [ -f "nginx-configs/default.conf" ]; then
    # Replace domain placeholders
    sed "s/your-domain.com/$DOMAIN/g" nginx-configs/default.conf > nginx/conf.d/default.conf
    print_success "Nginx configuration updated with domain: $DOMAIN"
else
    print_error "default.conf not found in nginx-configs/"
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.bsc-nginx.yml down 2>/dev/null || true
docker-compose -f docker-compose.bsc.yml down 2>/dev/null || true

# Start services without SSL first
print_status "Starting services for initial setup..."
docker-compose -f docker-compose.bsc-nginx.yml up -d zksync-portal-bsc

# Wait for application to be ready
print_status "Waiting for zkSync Portal to be ready..."
sleep 10

# Check if application is running
if ! docker exec zksync-portal-bsc wget --spider -q http://localhost:3000/health; then
    print_error "zkSync Portal is not responding. Check the logs:"
    docker logs zksync-portal-bsc --tail 20
    exit 1
fi

print_success "zkSync Portal is running!"

# Start Nginx without SSL
print_status "Starting Nginx for certificate generation..."

# Create temporary Nginx config for certificate generation
cat > nginx/conf.d/temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }
    
    location / {
        proxy_pass http://zksync-portal-bsc:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Start Nginx
docker-compose -f docker-compose.bsc-nginx.yml up -d nginx

# Wait for Nginx to be ready
sleep 5

# Generate SSL certificate
print_status "Generating SSL certificate..."

CERTBOT_ARGS="certonly --webroot --webroot-path=/var/www/html --email $EMAIL --agree-tos --no-eff-email"
if [ "$STAGING" = true ]; then
    CERTBOT_ARGS="$CERTBOT_ARGS --staging"
fi
CERTBOT_ARGS="$CERTBOT_ARGS -d $DOMAIN"

# Run certbot
docker run --rm \
    -v "$(pwd)/nginx/webroot:/var/www/html" \
    -v "zksync-portal-bsc_certbot-etc:/etc/letsencrypt" \
    -v "zksync-portal-bsc_certbot-var:/var/lib/letsencrypt" \
    certbot/certbot $CERTBOT_ARGS

if [ $? -eq 0 ]; then
    print_success "SSL certificate generated successfully!"
else
    print_error "Failed to generate SSL certificate. Check the logs above."
    exit 1
fi

# Replace temporary config with full SSL config
print_status "Updating Nginx configuration with SSL..."
rm nginx/conf.d/temp.conf
cp nginx-configs/default.conf nginx/conf.d/default.conf
sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/default.conf

# Restart Nginx with SSL configuration
print_status "Restarting Nginx with SSL configuration..."
docker-compose -f docker-compose.bsc-nginx.yml restart nginx

# Wait for services to be ready
sleep 10

# Test the deployment
print_status "Testing deployment..."

# Test HTTP redirect
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ || echo "000")
if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    print_success "HTTP to HTTPS redirect working!"
else
    print_warning "HTTP redirect test failed (status: $HTTP_STATUS)"
fi

# Test HTTPS (skip certificate verification for staging)
CURL_ARGS="-s -o /dev/null -w %{http_code}"
if [ "$STAGING" = true ]; then
    CURL_ARGS="$CURL_ARGS -k"
fi

HTTPS_STATUS=$(curl $CURL_ARGS https://$DOMAIN/ || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    print_success "HTTPS access working!"
else
    print_warning "HTTPS test failed (status: $HTTPS_STATUS)"
fi

# Show service status
print_status "Service status:"
docker-compose -f docker-compose.bsc-nginx.yml ps

# Show logs
print_status "Recent logs:"
echo "--- zkSync Portal logs ---"
docker logs zksync-portal-bsc --tail 10
echo ""
echo "--- Nginx logs ---"
docker logs zksync-nginx --tail 10

# Create certificate renewal script
print_status "Creating certificate renewal script..."
cat > renew-cert.sh << EOF
#!/bin/bash
# SSL Certificate Renewal Script

echo "Renewing SSL certificate for $DOMAIN..."

# Renew certificate
docker run --rm \\
    -v "\$(pwd)/nginx/webroot:/var/www/html" \\
    -v "zksync-portal-bsc_certbot-etc:/etc/letsencrypt" \\
    -v "zksync-portal-bsc_certbot-var:/var/lib/letsencrypt" \\
    certbot/certbot renew --webroot --webroot-path=/var/www/html

# Reload Nginx
docker-compose -f docker-compose.bsc-nginx.yml exec nginx nginx -s reload

echo "Certificate renewal completed!"
EOF

chmod +x renew-cert.sh

# Final instructions
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
print_status "Access Information:"
echo "  • HTTP URL: http://$DOMAIN (redirects to HTTPS)"
echo "  • HTTPS URL: https://$DOMAIN"
echo "  • Health Check: https://$DOMAIN/health"
echo ""
print_status "Management Commands:"
echo "  • View logs: docker-compose -f docker-compose.bsc-nginx.yml logs -f"
echo "  • Stop services: docker-compose -f docker-compose.bsc-nginx.yml down"
echo "  • Restart services: docker-compose -f docker-compose.bsc-nginx.yml restart"
echo "  • Renew certificate: ./renew-cert.sh"
echo ""
print_status "Certificate Information:"
echo "  • Type: $([ "$STAGING" = true ] && echo "Staging (for testing)" || echo "Production")"
echo "  • Renewal: Set up a cron job to run ./renew-cert.sh monthly"
echo ""
if [ "$STAGING" = true ]; then
    print_warning "You are using STAGING certificates!"
    print_warning "For production, run: $0 -d $DOMAIN -e $EMAIL -p"
fi

print_status "Suggested cron job for certificate renewal:"
echo "0 3 1 * * /path/to/your/deployment/renew-cert.sh >> /var/log/certbot-renewal.log 2>&1"