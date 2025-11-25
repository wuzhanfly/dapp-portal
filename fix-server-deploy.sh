#!/bin/bash

# Quick fix for server deployment
# Run this on your server to fix the docker-compose issue

echo "🔧 Fixing Docker Compose configuration..."

# Create deployment-specific docker-compose file
cat > docker-compose.bsc.yml << 'EOF'
services:
  zksync-portal-bsc:
    image: zksync-portal-bsc:latest
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
      - "traefik.http.routers.zksync-portal.rule=Host(`portal.yourdomain.com`)"
      - "traefik.http.routers.zksync-portal.tls=true"
      - "traefik.http.routers.zksync-portal.tls.certresolver=letsencrypt"
      - "traefik.http.services.zksync-portal.loadbalancer.server.port=3000"
    networks:
      - zksync-network

networks:
  zksync-network:
    driver: bridge
EOF

echo "✅ Fixed docker-compose.bsc.yml"

# Now start the service
echo "🚀 Starting zkSync Portal service..."
docker-compose -f docker-compose.bsc.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ zkSync Portal deployed successfully!"
    echo ""
    echo "📋 Access Information:"
    echo "  • Portal URL: http://localhost:3000"
    echo "  • Health Check: http://localhost:3000/health"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker-compose -f docker-compose.bsc.yml logs -f"
    echo "  • Stop service: docker-compose -f docker-compose.bsc.yml down"
    echo "  • Restart service: docker-compose -f docker-compose.bsc.yml restart"
    
    # Show container status
    echo ""
    echo "📊 Container Status:"
    docker-compose -f docker-compose.bsc.yml ps
    
    # Test health endpoint
    echo ""
    echo "🏥 Testing health endpoint..."
    sleep 3
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed - service might still be starting up"
    fi
    
else
    echo "❌ Deployment failed!"
    exit 1
fi