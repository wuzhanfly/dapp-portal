#!/bin/bash

# CORS 问题修复脚本
# 修复 "Access-Control-Allow-Origin header contains multiple values" 错误

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

print_status "🔧 修复 CORS 问题..."

# 检查是否使用 HTTPS
USE_HTTPS=false
if [ "$1" = "--https" ] || [ "$1" = "-s" ]; then
    USE_HTTPS=true
    print_status "使用 HTTPS 配置"
else
    print_status "使用 HTTP 配置"
fi

# 备份现有配置
if [ -f "nginx/conf.d/default.conf" ]; then
    print_status "备份现有 Nginx 配置..."
    cp nginx/conf.d/default.conf nginx/conf.d/default.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# 复制新的配置文件
if [ "$USE_HTTPS" = true ]; then
    print_status "应用 HTTPS + CORS 修复配置..."
    cp nginx-configs/https-cors-fix.conf nginx/conf.d/default.conf
else
    print_status "应用 HTTP + CORS 修复配置..."
    cp nginx-configs/cors-fix.conf nginx/conf.d/default.conf
fi

# 测试 Nginx 配置
print_status "测试 Nginx 配置..."
if docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" nginx:alpine nginx -t; then
    print_success "Nginx 配置测试通过!"
else
    print_error "Nginx 配置测试失败!"
    exit 1
fi

# 重启 Nginx 容器
print_status "重启 Nginx 容器..."
if docker-compose -f docker-compose.bsc-nginx.yml restart nginx; then
    print_success "Nginx 重启成功!"
else
    print_error "Nginx 重启失败!"
    exit 1
fi

# 等待服务启动
sleep 5

# 测试 CORS
print_status "测试 CORS 配置..."

# 测试 OPTIONS 请求
CORS_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    -H "Origin: https://testnet-bridge.maichain.org" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    http://localhost/ || echo "000")

if [ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]; then
    print_success "CORS 预检请求测试通过! (状态码: $CORS_TEST)"
else
    print_warning "CORS 预检请求测试失败 (状态码: $CORS_TEST)"
fi

# 测试实际请求
MAIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: https://testnet-bridge.maichain.org" \
    http://localhost/health || echo "000")

if [ "$MAIN_TEST" = "200" ]; then
    print_success "主要请求测试通过! (状态码: $MAIN_TEST)"
else
    print_warning "主要请求测试失败 (状态码: $MAIN_TEST)"
fi

# 显示服务状态
print_status "服务状态:"
docker-compose -f docker-compose.bsc-nginx.yml ps

# 显示最近的日志
print_status "Nginx 最近日志:"
docker logs zksync-nginx --tail 10

echo ""
print_success "🎉 CORS 修复完成!"
echo ""
print_status "修复内容:"
echo "  ✅ 移除重复的 Access-Control-Allow-Origin 头部"
echo "  ✅ 正确处理 OPTIONS 预检请求"
echo "  ✅ 设置适当的 CORS 头部"
echo "  ✅ 添加安全头部"
echo ""
print_status "测试建议:"
echo "  1. 在浏览器中访问: http://localhost"
echo "  2. 打开开发者工具检查网络请求"
echo "  3. 确认没有 CORS 错误"
echo ""
if [ "$USE_HTTPS" = true ]; then
    print_warning "注意: HTTPS 配置需要有效的 SSL 证书"
    print_status "请确保证书路径正确: /etc/ssl/certs/maichain.org.crt"
fi