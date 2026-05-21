# GitHub Actions CI/CD 部署实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 通过 GitHub Actions 实现 Push 到 main 自动部署前后端到 Ubuntu 服务器

**架构：** 单 workflow 文件，构建前端 → rsync 同步 → SSH 远程执行迁移和重启 PM2。附带服务器初始化脚本用于新服务器环境准备。

**技术栈：** GitHub Actions, rsync, SSH, PM2, Node.js 22, MySQL 8.x

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `scripts/init-server.sh` | 新服务器环境初始化（Node.js, PM2, MySQL, 防火墙） |
| `.github/workflows/deploy.yml` | CI/CD workflow（构建、同步、部署） |

---

### 任务 1：创建服务器初始化脚本

**文件：**
- 创建：`scripts/init-server.sh`

- [ ] **步骤 1：创建 scripts 目录**

运行：`mkdir -p scripts`

- [ ] **步骤 2：编写 init-server.sh**

创建 `scripts/init-server.sh`，包含以下步骤：

1. 系统更新 (`apt-get update && apt-get upgrade -y`)
2. 安装 Node.js 22 (NodeSource)
3. 安装 PM2
4. 安装 MySQL 8.x
5. 创建数据库和用户（交互式输入密码）
6. 创建部署目录 `/var/www/todolist`
7. 生成 `.env` 配置文件
8. 安装 Nginx 并配置反向代理（前端静态文件 + API 代理到 3000 端口）
9. 配置 UFW 防火墙

完整内容见 `scripts/init-server.sh` 文件。

- [ ] **步骤 3：设置脚本权限**

运行：`chmod +x scripts/init-server.sh`

- [ ] **步骤 4：Commit**

```bash
git add scripts/init-server.sh
git commit -m "feat: add server initialization script"
```

---

### 任务 2：创建 GitHub Actions Workflow

**文件：**
- 创建：`.github/workflows/deploy.yml`

- [ ] **步骤 1：创建目录**

运行：`mkdir -p .github/workflows`

- [ ] **步骤 2：编写 deploy.yml**

创建 `.github/workflows/deploy.yml`，内容如下：

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
          switches: >-
            -avzr --delete
            --exclude=node_modules/
            --exclude=.git/
            --exclude=.env
            --exclude=server/.env
            --exclude=*.log
            --exclude=.DS_Store
            --exclude=client/src/
            --exclude=client/node_modules/
            --exclude=client/index.html
            --exclude=client/vite.config.js
            --exclude=client/tailwind.config.js
            --exclude=client/postcss.config.js
            --exclude=scripts/
            --exclude=docs/
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
            set -e
            export NODE_ENV=production
            cd "${{ secrets.SERVER_DEPLOY_PATH }}/server"

            if [ ! -f .env ]; then
              echo "ERROR: .env file not found at $(pwd)/.env"
              echo "Please run init-server.sh on the server first."
              exit 1
            fi

            npm install --production
            npx sequelize-cli db:migrate
            pm2 restart todolist-server
```

- [ ] **步骤 3：Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deploy workflow"
```

---

### 任务 3：验证文件完整性

- [ ] **步骤 1：确认文件存在**

运行：`ls -la scripts/init-server.sh .github/workflows/deploy.yml`

预期：两个文件都存在，init-server.sh 有可执行权限

- [ ] **步骤 2：验证 YAML 语法**

运行：`python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`

预期：无报错

- [ ] **步骤 3：验证 shell 脚本语法**

运行：`bash -n scripts/init-server.sh`

预期：无报错

- [ ] **步骤 4：最终 Commit（如有遗漏文件）**

```bash
git status
# 确认没有未提交的变更
```

---

## 部署后操作清单

完成代码后，用户需要手动执行以下步骤：

### 1. 服务器初始化（一次性）

```bash
# 上传脚本到服务器
scp scripts/init-server.sh user@server_ip:/tmp/

# SSH 到服务器执行
ssh user@server_ip
chmod +x /tmp/init-server.sh
sudo /tmp/init-server.sh
```

### 2. 配置 SSH 密钥

```bash
# 本地生成密钥
ssh-keygen -t ed25519 -C "github-actions-deploy"

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server_ip

# 查看私钥内容（复制到 GitHub Secrets）
cat ~/.ssh/id_ed25519
```

### 3. 配置 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 值 |
|---|---|
| `SSH_PRIVATE_KEY` | 私钥完整内容（包含 BEGIN/END 行） |
| `SERVER_HOST` | 服务器 IP |
| `SERVER_USER` | SSH 用户名 |
| `SERVER_DEPLOY_PATH` | `/var/www/todolist` |

### 4. 首次部署

```bash
git push origin main
```

然后在 GitHub 仓库的 Actions 标签页查看部署状态。
