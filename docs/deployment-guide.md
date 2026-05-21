# TodoList 部署指南

## 前置条件

- Ubuntu 服务器（已安装 Nginx）
- GitHub 仓库：`zhishichang/todolist2`
- 本地有 SSH 客户端

---

## 第一步：服务器初始化

### 1.1 上传初始化脚本

```bash
scp scripts/init-server.sh user@你的服务器IP:/tmp/
```

### 1.2 SSH 登录服务器并执行

```bash
ssh user@你的服务器IP
chmod +x /tmp/init-server.sh
sudo /tmp/init-server.sh
```

脚本会自动完成：
- 安装 Node.js 22
- 安装 PM2
- 安装 MySQL 8.x
- 创建数据库 `todolist` 和专用用户
- 创建部署目录 `/var/www/todolist`
- 生成 `.env` 配置文件
- 配置 UFW 防火墙

执行过程中会提示输入：
- MySQL root 密码
- 数据库用户名（默认 `todolist_user`）
- 数据库密码

---

## 第二步：配置 SSH 密钥

### 2.1 本地生成密钥对

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy"
```

按提示选择保存路径（默认 `~/.ssh/id_ed25519`），密码可留空。

### 2.2 将公钥添加到服务器

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@你的服务器IP
```

### 2.3 验证免密登录

```bash
ssh -i ~/.ssh/id_ed25519 user@你的服务器IP
```

确认无需输入密码即可登录。

### 2.4 获取私钥内容

```bash
cat ~/.ssh/id_ed25519
```

复制完整输出（包含 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）。

---

## 第三步：配置 GitHub Secrets

进入 GitHub 仓库：`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

添加以下 4 个 Secrets：

| 名称 | 值 |
|---|---|
| `SSH_PRIVATE_KEY` | 上一步复制的私钥完整内容 |
| `SERVER_HOST` | 服务器 IP 地址，如 `101.200.29.174` |
| `SERVER_USER` | SSH 登录用户名，如 `root` 或 `ubuntu` |
| `SERVER_DEPLOY_PATH` | 服务器项目路径，如 `/var/www/todolist` |

---

## 第四步：首次部署

### 4.1 推送代码触发部署

```bash
git push origin main
```

### 4.2 查看部署状态

进入 GitHub 仓库：`Actions` 标签页 → 点击最新的 workflow 运行

部署流程：
1. Checkout 代码
2. 安装 Node.js 22
3. 安装前端依赖（npm ci）
4. 构建前端（npm run build）
5. rsync 同步文件到服务器
6. SSH 远程执行：
   - 安装后端依赖
   - 执行数据库迁移
   - 重启 PM2

### 4.3 验证部署

```bash
# 检查 API 是否正常
curl http://你的服务器IP/api/todos

# 检查前端页面
# 浏览器访问 http://你的服务器IP
```

---

## 日常维护

### 查看部署日志

GitHub 仓库 → `Actions` → 点击具体的 workflow 运行 → 查看各步骤日志

### 查看服务器日志

```bash
# SSH 登录服务器后
pm2 logs todolist-server
pm2 status
```

### 重启服务

```bash
pm2 restart todolist-server
```

### 查看 Nginx 日志

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 故障排查

### 部署失败

1. 检查 GitHub Actions 日志中的错误信息
2. 确认 4 个 Secrets 配置正确
3. 确认服务器 SSH 密钥已添加
4. 确认服务器防火墙允许 SSH（端口 22）

### 数据库迁移失败

```bash
# SSH 登录服务器
cd /var/www/todolist/server
npx sequelize-cli db:migrate
```

### PM2 服务异常

```bash
pm2 status
pm2 logs todolist-server --lines 50
pm2 restart todolist-server
```

---

## 关键文件路径

| 用途 | 路径 |
|---|---|
| 后端代码 | `/var/www/todolist/server` |
| 前端构建 | `/var/www/todolist/client/dist` |
| 环境变量 | `/var/www/todolist/server/.env` |
| Nginx 配置 | `/etc/nginx/sites-available/todolist` |
| PM2 日志 | `~/.pm2/logs/` |
