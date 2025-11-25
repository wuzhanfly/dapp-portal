#!/bin/bash

# zkSync Bridge 部署脚本
# 本地构建镜像，推送到服务器运行

set -e

# 配置变量
IMAGE_NAME="zksync-bridge"
IMAGE_TAG="latest"
SERVER_USER="ubuntu"
SERVER_HOST="54.255.170.191"
SSH_KEY="/home/jerry/zk_application.pem"
SERVER_DIR="/home/ubuntu/node/bridge"
CONTAINER_NAME="zksync-bridge"

echo "🚀 开始部署 zkSync Bridge..."

# 1. 本地构建镜像
echo "📦 构建 Docker 镜像..."
docker build -f Dockerfile.bsc -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 2. 保存镜像为tar文件
echo "💾 导出镜像..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${IMAGE_NAME}.tar

# 3. 传输镜像到服务器
echo "📤 传输镜像到服务器..."
scp -i ${SSH_KEY} ${IMAGE_NAME}.tar ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/

# 4. 传输配置文件到服务器
echo "📤 传输配置文件..."
scp -i ${SSH_KEY} docker-compose.bridge.yml ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/
scp -i ${SSH_KEY} -r nginx-configs ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/
scp -i ${SSH_KEY} server-nginx-bridge.conf ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/

# 5. 在服务器上执行部署
echo "🚀 在服务器上部署..."
ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} << EOF
    # 进入部署目录
    cd ${SERVER_DIR}
    
    # 加载镜像
    echo "📥 加载 Docker 镜像..."
    docker load -i zksync-bridge.tar
    
    # 停止旧容器
    echo "🛑 停止旧容器..."
    docker-compose -f docker-compose.bridge.yml down 2>/dev/null || true
    
    # 创建日志目录
    mkdir -p nginx/logs
    
    # 启动新容器
    echo "▶️ 启动容器..."
    docker-compose -f docker-compose.bridge.yml up -d
    
    # 配置主机nginx代理
    echo "⚙️ 配置主机nginx..."
    sudo cp ~/server-nginx-bridge.conf /etc/nginx/sites-available/bridge-proxy
    sudo ln -sf /etc/nginx/sites-available/bridge-proxy /etc/nginx/sites-enabled/bridge-proxy
    
    # 重启主机nginx
    sudo nginx -t && sudo systemctl restart nginx
    
    # 清理临时文件
    rm -f zksync-bridge.tar
    
    echo "✅ 部署完成!"
    echo "🌐 访问地址: http://testnet-bridge.maichain.org"
    
    # 显示容器状态
    docker ps | grep zksync-bridge
    
    # 显示日志
    echo "📋 容器日志:"
    docker-compose -f docker-compose.bridge.yml logs --tail=20
EOF

# 6. 清理本地临时文件
echo "🧹 清理本地文件..."
rm -f ${IMAGE_NAME}.tar

echo "🎉 部署完成!"
echo "🌐 访问地址: http://testnet-bridge.maichain.org"
echo "📊 查看日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'cd ${SERVER_DIR} && docker logs -f ${CONTAINER_NAME}'"