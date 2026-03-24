#!/bin/bash

# Quick update script - only update config.js without rebuilding Docker image
# 快速更新 - 只更新 config.js 不重新构建镜像

set -e

SERVER_USER="ubuntu"
SERVER_HOST="54.255.170.191"
SSH_KEY="~/zk_application.pem"
SERVER_PATH="/home/ubuntu/zk_node"

echo "🚀 Quick config update..."
echo ""

# Upload new config.js
echo "1. Uploading new config.js..."
scp -i $SSH_KEY config.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

# Restart container to pick up new config
echo ""
echo "2. Restarting portal container..."
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_HOST} << EOF
cd ${SERVER_PATH}
docker-compose -f docker-compose.bsc.yml restart zksync-portal-bsc
echo "Waiting for container to start..."
sleep 5
docker-compose -f docker-compose.bsc.yml ps
EOF

echo ""
echo "✅ Config updated!"
echo ""
echo "🌐 Access portal at: http://54.255.170.191:8080"
echo ""
echo "📋 View logs:"
echo "   ssh -i ~/zk_application.pem ubuntu@54.255.170.191 'cd /home/ubuntu/zk_node && docker-compose -f docker-compose.bsc.yml logs -f zksync-portal-bsc'"
