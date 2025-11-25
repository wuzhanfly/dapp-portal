#!/bin/bash

# 更新 Nginx 配置以支持 Cloudflare SSL
# 适用于 testnet-bridge.maichain.org

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

print_status "🔧 Updating Nginx configuration for Cloudflare SSL"

# 备份现有配置
if [ -f "nginx/conf.d/default.conf" ]; then
    print_status "Backing up existing configuration..."
    cp nginx/conf.d/default.conf nginx/conf.d/default.conf.backup
    print_success "Configuration backed up to default.conf.backup"
fi

# 复制 Cloudflare 适配配置
print_status "Applying Cloudflare configuration..."
cp nginx-cloudflare.conf nginx/conf.d/default.conf

# 更新主 nginx.conf 以支持 real_ip 模块
print_status "Updating main nginx.conf..."
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

# 加载 real_ip 模块
load_module modules/ngx_http_realip_module.so;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format (包含真实 IP)
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    '"$http_cf_connecting_ip"';

    access_log /var/log/nginx/access.log main;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

# 重启 Nginx 容器
print_status "Restarting Nginx container..."
docker-compose -f docker-compose.bsc-nginx.yml restart nginx

# 等待服务启动
sleep 5

# 测试配置
print_status "Testing configuration..."

# 测试 HTTP 访问
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    print_success "HTTP access working!"
else
    print_warning "HTTP test failed (status: $HTTP_STATUS)"
fi

# 测试健康检查
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    print_success "Health check working!"
else
    print_warning "Health check failed (status: $HEALTH_STATUS)"
fi

# 显示 Nginx 日志
print_status "Recent Nginx logs:"
docker logs zksync-nginx --tail 10

echo ""
print_success "🎉 Cloudflare configuration applied successfully!"
echo ""
print_status "Next Steps:"
echo "1. 确保 Cloudflare SSL 模式设置为 'Flexible'"
echo "2. 测试 HTTPS 访问: https://testnet-bridge.maichain.org/bridge/"
echo "3. 检查 Cloudflare DNS 设置确保指向正确的服务器 IP"
echo ""
print_status "Cloudflare SSL 模式设置:"
echo "• 登录 Cloudflare Dashboard"
echo "• 选择域名 maichain.org"
echo "• 进入 SSL/TLS > Overview"
echo "• 设置加密模式为 'Flexible'"
echo ""
print_status "如果仍有问题，请检查:"
echo "• Cloudflare DNS A 记录是否指向正确的服务器 IP"
echo "• 服务器防火墙是否开放 80 和 443 端口"
echo "• Cloudflare 代理状态是否为橙色云朵 (已代理)"
EOF

chmod +x update-cloudflare-config.sh