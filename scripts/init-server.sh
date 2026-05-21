#!/bin/bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "请使用 sudo 运行此脚本"
  exit 1
fi

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
mkdir -p "${DEPLOY_PATH}"
chown "$SUDO_USER":"$SUDO_USER" "${DEPLOY_PATH}"
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

# 8. 安装 Nginx
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo "Nginx installed and started"

# 9. 配置 Nginx 站点
NGINX_CONF="/etc/nginx/sites-available/todolist"
cat > "${NGINX_CONF}" <<'NGINX'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /var/www/todolist/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到 Node.js
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/todolist
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "Nginx configured for todolist"

# 10. 配置防火墙
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall configured"

# 11. 完成
echo "=== 初始化完成 ==="
echo "Deploy path: ${DEPLOY_PATH}"
echo "Next steps:"
echo "  1. Upload your SSH public key for GitHub Actions"
echo "  2. Configure GitHub Secrets"
echo "  3. Push to main to trigger first deployment"
