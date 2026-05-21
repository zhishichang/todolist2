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
