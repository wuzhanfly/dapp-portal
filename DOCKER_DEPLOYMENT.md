# 🐳 zkSync Portal Docker 部署指南

## 📋 概述

本指南介绍如何使用 Docker Compose 部署 zkSync Portal，支持多环境配置和简化的管理操作。

## 🏗️ 架构说明

### 支持的环境
- **Development** (`dev`): 本地开发和测试环境
- **Production** (`prod`): zkSync Era 主网生产环境  
- **BSC Hyperchain** (`bsc`): BSC zkStack 超链环境

### Docker 镜像结构
- **基础镜像**: Node.js 20 Alpine
- **Web 服务器**: Nginx (生产环境)
- **构建模式**: 根据环境自动配置
- **端口**: 3000 (dev/bsc), 3001 (prod)

### 文件结构
```
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── docker-compose.bsc.yml      # BSC 超链配置
├── Dockerfile                  # 通用 Dockerfile
├── Dockerfile.bsc             # BSC 专用 Dockerfile
├── docker/
│   └── nginx.conf              # Nginx 配置
├── scripts/
│   └── docker-deploy.sh        # 统一部署脚本
├── Makefile                   # 快捷命令
├── .dockerignore              # Docker 忽略文件
└── .env.production            # 生产环境配置
```

## 🚀 快速开始

### 1. 环境准备
```bash
# 确保 Docker 和 Docker Compose 已安装
docker --version
docker-compose --version

# 克隆项目
git clone <repository-url>
cd dapp-portal
```

### 2. 选择部署方式

#### 方式 A: 使用 Makefile (推荐)
```bash
# 查看所有可用命令
make help

# 启动 BSC 超链环境 (最常用)
make bsc

# 启动开发环境
make dev

# 启动生产环境
make prod
```

#### 方式 B: 使用部署脚本
```bash
# 启动 BSC 超链环境
./scripts/docker-deploy.sh bsc up

# 启动开发环境
./scripts/docker-deploy.sh dev up

# 启动生产环境
./scripts/docker-deploy.sh prod up
```

#### 方式 C: 直接使用 Docker Compose
```bash
# BSC 超链环境
docker-compose -f docker-compose.bsc.yml up --build -d

# 开发环境
docker-compose -f docker-compose.yml up --build -d

# 生产环境
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. 访问应用

- **开发环境**: http://localhost:3000
- **生产环境**: http://localhost:3001
- **BSC 超链**: http://localhost:3000

## ⚙️ 管理命令

### 使用 Makefile

```bash
# 环境管理
make bsc          # 启动 BSC 超链
make dev          # 启动开发环境
make prod         # 启动生产环境

make down-bsc     # 停止 BSC 超链
make down-dev     # 停止开发环境
make down-prod    # 停止生产环境

# 日志查看
make logs-bsc     # 查看 BSC 日志
make logs-dev     # 查看开发日志
make logs-prod    # 查看生产日志

# 镜像构建
make build-bsc    # 构建 BSC 镜像
make build-dev    # 构建开发镜像
make build-prod   # 构建生产镜像

# 实用工具
make status       # 查看所有服务状态
make clean        # 清理所有容器和镜像
```

### 使用部署脚本

```bash
# 基本语法
./scripts/docker-deploy.sh [环境] [操作]

# 环境: dev, prod, bsc
# 操作: up, down, restart, logs, build, status

# 示例
./scripts/docker-deploy.sh bsc up       # 启动 BSC 环境
./scripts/docker-deploy.sh bsc down     # 停止 BSC 环境
./scripts/docker-deploy.sh bsc logs     # 查看 BSC 日志
./scripts/docker-deploy.sh bsc restart  # 重启 BSC 环境
./scripts/docker-deploy.sh bsc build    # 构建 BSC 镜像
./scripts/docker-deploy.sh bsc status   # 查看 BSC 状态
```

## 🔧 环境配置

### 开发环境 (dev)
- 基于 `docker-compose.yml`
- 端口: 3000
- 用于本地开发和测试

### 生产环境 (prod)
- 基于 `docker-compose.prod.yml`
- 端口: 3001
- 包含健康检查和 Traefik 标签
- 适用于 zkSync Era 主网

### BSC 超链环境 (bsc)
- 基于 `docker-compose.bsc.yml`
- 端口: 3000
- 专为 BSC zkStack 优化
- 包含完整的监控和重启策略

### 环境变量配置

#### 开发环境 (.env)
```bash
NODE_ENV=development
```

#### 生产环境 (.env.production)
```bash
NODE_TYPE=hyperchain
NODE_ENV=production
WALLET_CONNECT_PROJECT_ID=your_project_id
ANKR_TOKEN=your_ankr_token
SENTRY_DSN=your_sentry_dsn
```

## 🌐 网络配置

### BSC 超链网络
- **L1**: BSC Testnet (Chain ID: 97)
- **L2**: ZK BSC Chain (Chain ID: 9720)
- **RPC 端点**: 已在配置中预设

### 端口映射
- 开发环境: `3000:3000`
- 生产环境: `3001:3000`
- BSC 超链: `3000:3000`

## 📊 监控和日志

### 健康检查
```bash
# 检查应用健康状态
curl http://localhost:3000/health

# 查看容器健康状态
docker inspect --format='{{.State.Health.Status}}' zksync-portal-bsc
```

### 日志管理
```bash
# 实时日志 (Makefile)
make logs-bsc

# 实时日志 (脚本)
./scripts/docker-deploy.sh bsc logs

# 直接 Docker Compose
docker-compose -f docker-compose.bsc.yml logs -f

# 查看特定行数
docker-compose -f docker-compose.bsc.yml logs --tail 100
```

### 服务状态
```bash
# 查看所有环境状态
make status

# 查看特定环境状态
./scripts/docker-deploy.sh bsc status
```

## � 安全配置

### Nginx 安全头
```nginx
# 已配置的安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 容器安全
- 使用非 root 用户 (`nextjs`)
- 最小权限原则
- 定期更新基础镜像
- 健康检查机制

## 🚀 生产部署

### 1. 更新配置
```bash
# 编辑生产环境配置
vim .env.production

# 更新域名设置 (如使用 Traefik)
vim docker-compose.prod.yml
```

### 2. 部署到生产
```bash
# 使用 Makefile
make prod

# 或使用脚本
./scripts/docker-deploy.sh prod up
```

### 3. 反向代理配置 (可选)

#### Nginx 反向代理
```nginx
server {
    listen 80;
    server_name portal.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Traefik (已配置标签)
Docker Compose 文件已包含 Traefik 标签，只需更新域名即可。

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   sudo lsof -i :3000
   
   # 修改端口映射
   vim docker-compose.bsc.yml
   ```

2. **构建失败**
   ```bash
   # 清理 Docker 缓存
   make clean
   docker system prune -a
   
   # 重新构建
   make build-bsc
   ```

3. **权限问题**
   ```bash
   # 修复脚本权限
   chmod +x scripts/docker-deploy.sh
   ```

4. **内存不足**
   ```bash
   # 检查系统资源
   docker system df
   free -h
   
   # 清理未使用资源
   docker system prune
   ```

### 调试模式

```bash
# 前台运行查看详细输出
docker-compose -f docker-compose.bsc.yml up --build

# 进入容器调试
docker exec -it zksync-portal-bsc sh
```

## 📈 性能优化

### 1. 镜像优化
- 多阶段构建减少镜像大小
- 使用 Alpine 基础镜像
- 优化 Docker 层缓存

### 2. Nginx 优化
```nginx
# 已配置的优化项
gzip on;                    # 启用压缩
sendfile on;               # 高效文件传输
keepalive_timeout 65;      # 连接保持
client_max_body_size 16M;  # 请求体大小限制
```

### 3. 资源限制
```yaml
# 在 docker-compose 中添加资源限制
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

## 🔄 更新和维护

### 应用更新
```bash
# 拉取最新代码
git pull origin main

# 重新部署 BSC 环境
make down-bsc
make bsc

# 或使用脚本
./scripts/docker-deploy.sh bsc restart
```

### 滚动更新
```bash
# 构建新镜像
make build-bsc

# 重启服务 (自动使用新镜像)
make restart-bsc
```

### 备份配置
```bash
# 备份配置文件
tar -czf backup-$(date +%Y%m%d).tar.gz \
  docker-compose*.yml \
  .env* \
  scripts/ \
  docker/
```

## 📞 支持和帮助

### 获取帮助
```bash
# 查看脚本帮助
./scripts/docker-deploy.sh --help

# 查看 Makefile 帮助
make help
```

### 检查清单
- [ ] Docker 和 Docker Compose 已安装
- [ ] 端口 3000/3001 未被占用
- [ ] 有足够的磁盘空间 (至少 2GB)
- [ ] 网络连接正常
- [ ] 环境变量配置正确

---

🎉 现在你可以轻松管理 zkSync Portal 的多环境 Docker 部署了！使用 `make help` 查看所有可用命令。