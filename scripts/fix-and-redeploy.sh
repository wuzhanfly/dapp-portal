#!/bin/bash

# Quick fix and redeploy script
# 修复端口冲突并重新部署

set -e

SERVER_USER="ubuntu"
SERVER_HOST="54.255.170.191"
SSH_KEY="~/zk_application.pem"
SERVER_PATH="/home/ubuntu/zk_node"

echo "🔧 Fixing port conflict and redeploying..."
echo ""

# Stop all containers using port 80
echo "1. Stopping containers that might use port 80..."
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_HOST} << 'EOF'
# Find and stop any container using port 80
PORT_80_CONTAINERS=$(docker ps --format '{{.Names}}' --filter "publish=80")
if [ -n "$PORT_80_CONTAINERS" ]; then
    echo "Stopping containers using port 80: $PORT_80_CONTAINERS"
    echo "$PORT_80_CONTAINERS" | xargs -r docker stop
else
    echo "No containers using port 80"
fi

# Also check for nginx processes
NGINX_PIDS=$(sudo lsof -ti:80 2>/dev/null || true)
if [ -n "$NGINX_PIDS" ]; then
    echo "Found processes using port 80: $NGINX_PIDS"
    echo "Killing them..."
    echo "$NGINX_PIDS" | xargs -r sudo kill -9
fi

echo "✅ Port 80 is now free"
EOF

echo ""
echo "2. Stopping existing portal containers..."
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && docker-compose -f docker-compose.bsc.yml down 2>/dev/null || true"

echo ""
echo "3. Starting portal with port 8080..."
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && docker-compose -f docker-compose.bsc.yml up -d"

echo ""
echo "4. Checking status..."
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && docker-compose -f docker-compose.bsc.yml ps"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access portal at:"
echo "   http://54.255.170.191:8080"
echo ""
echo "📋 View logs:"
echo "   ssh -i ~/zk_application.pem ubuntu@54.255.170.191 'cd /home/ubuntu/zk_node && docker-compose -f docker-compose.bsc.yml logs -f'"
