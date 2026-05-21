# GitHub Actions CI/CD 部署设计

## 概述

通过 GitHub Actions 实现 Push 到 main 分支自动部署前后端到 Ubuntu 服务器，不使用容器化。

## 需求

- **触发方式**：Push 到 main 自动部署
- **部署范围**：前端构建 + 后端一起部署
- **传输方式**：SSH + rsync
- **测试**：不做，直接部署
- **数据库迁移**：自动执行

## 架构

```
GitHub (push to main)
  → GitHub Actions (ubuntu-latest)
    1. Checkout 代码
    2. Setup Node.js 22
    3. 安装前端依赖 (npm ci)
    4. 构建前端 (npm run build)
    5. rsync 同步文件到服务器
    6. SSH 远程执行：
       a. npm install --production
       b. npx sequelize-cli db:migrate
       c. pm2 restart todolist-server
```

## Workflow 文件

路径：`.github/workflows/deploy.yml`

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json

      - name: Install frontend dependencies
        working-directory: client
        run: npm ci

      - name: Build frontend
        working-directory: client
        run: npm run build

      - name: Deploy to server via rsync
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: -avzr --delete
          path: ./
          remote_path: ${{ secrets.SERVER_DEPLOY_PATH }}
          remote_host: ${{ secrets.SERVER_HOST }}
          remote_user: ${{ secrets.SERVER_USER }}
          remote_key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Execute remote SSH commands
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ secrets.SERVER_DEPLOY_PATH }}/server
            npm install --production
            npx sequelize-cli db:migrate
            pm2 restart todolist-server
```

## GitHub Secrets 配置

在仓库 Settings → Secrets and variables → Actions 中配置：

| Secret 名称 | 说明 |
|---|---|
| `SSH_PRIVATE_KEY` | SSH 私钥内容 |
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | SSH 登录用户名 |
| `SERVER_DEPLOY_PATH` | 服务器项目路径 |

## rsync 排除规则

```
node_modules/
.git/
.env
*.log
.DS_Store
client/src/
client/node_modules/
client/index.html
client/vite.config.js
client/tailwind.config.js
client/postcss.config.js
scripts/
docs/
```

- `.env` 被排除，服务器上的环境变量不会被覆盖
- 前端源码被排除，只同步构建产物 `dist/`

## SSH 远程部署步骤

```bash
cd /var/www/todolist/server
npm install --production
npx sequelize-cli db:migrate
pm2 restart todolist-server
```

## 使用的 GitHub Actions

| Action | 版本 | 用途 |
|---|---|---|
| `actions/checkout` | v4 | 拉取代码 |
| `actions/setup-node` | v4 | 安装 Node.js 22 |
| `burnett01/rsync-deployments` | 7.0.1 | rsync 文件同步 |
| `appleboy/ssh-action` | v1 | SSH 远程执行命令 |

## 服务器初始化脚本

新服务器需要初始化运行环境。提供一个初始化脚本 `scripts/init-server.sh`，在服务器上手动执行一次。

**脚本功能**：
1. 安装 Node.js 22
2. 安装 PM2
3. 安装 MySQL 8.x
4. 创建数据库和用户
5. 创建部署目录
6. 配置 .env 文件
7. 配置 UFW 防火墙
8. 设置 PM2 开机自启

**脚本路径**：`scripts/init-server.sh`

**使用方式**：
```bash
# 上传脚本到服务器
scp scripts/init-server.sh user@server_ip:/tmp/

# SSH 到服务器执行
ssh user@server_ip
chmod +x /tmp/init-server.sh
sudo /tmp/init-server.sh
```

**脚本内容**（交互式，会提示输入数据库密码等信息）：

```bash
#!/bin/bash
set -e

echo "=== TodoList 服务器初始化 ==="

# 1. 系统更新
apt-get update && apt-get upgrade -y

# 2. 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
echo "Node.js $(node -v) installed"

# 3. 安装 PM2
npm install -g pm2
echo "PM2 installed"

# 4. 安装 MySQL
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql
echo "MySQL installed and started"

# 5. 创建数据库和用户
read -sp "Enter MySQL root password: " MYSQL_ROOT_PW
echo
read -p "Enter todolist DB username [todolist_user]: " DB_USER
DB_USER=${DB_USER:-todolist_user}
read -sp "Enter todolist DB password: " DB_PW
echo

mysql -u root -p"${MYSQL_ROOT_PW}" <<EOF
CREATE DATABASE IF NOT EXISTS todolist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PW}';
GRANT ALL PRIVILEGES ON todolist.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
echo "Database and user created"

# 6. 创建部署目录
DEPLOY_PATH="/var/www/todolist"
mkdir -p ${DEPLOY_PATH}
chown $SUDO_USER:$SUDO_USER ${DEPLOY_PATH}
echo "Deploy directory created: ${DEPLOY_PATH}"

# 7. 创建 .env 文件
ENV_FILE="${DEPLOY_PATH}/server/.env"
mkdir -p "${DEPLOY_PATH}/server"
cat > "${ENV_FILE}" <<EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=todolist
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PW}
PORT=3000
NODE_ENV=production
EOF
chmod 600 "${ENV_FILE}"
echo ".env file created at ${ENV_FILE}"

# 8. 配置防火墙
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall configured"

# 9. 完成
echo "=== 初始化完成 ==="
echo "Deploy path: ${DEPLOY_PATH}"
echo "Next steps:"
echo "  1. Upload your SSH public key for GitHub Actions"
echo "  2. Configure GitHub Secrets"
echo "  3. Push to main to trigger first deployment"
```

## SSH 密钥准备

```bash
# 生成密钥（如果已有可跳过）
ssh-keygen -t ed25519 -C "github-actions-deploy"

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server_ip

# 将私钥内容复制到 GitHub Secrets 的 SSH_PRIVATE_KEY
cat ~/.ssh/id_ed25519
```

## 安全注意事项

- SSH 私钥存储在 GitHub Secrets 中，不会暴露在代码中
- `.env` 文件被 rsync 排除，数据库密码等敏感信息不会被覆盖
- 服务器防火墙只开放必要端口（80/443/22）
