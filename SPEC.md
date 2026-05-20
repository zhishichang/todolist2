# TodoList Application Specification

## Overview

A personal TodoList web application built with Vue 3 + Express + MySQL. Single-user, no authentication, flat task list with batch operations and drag-and-drop sorting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 (Composition API) + Vue Router + Pinia + Tailwind CSS |
| Backend | Express.js (JavaScript, no TypeScript) + Sequelize ORM |
| Database | MySQL 8.x |
| Dev Tooling | Vite (frontend) + nodemon (backend) |
| Deployment | Bare metal (manual) |

## Project Structure

```
todolist/
├── client/                  # Vue 3 frontend (独立 package.json)
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── views/           # 页面视图
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── api/             # API 请求封装
│   │   ├── router/          # Vue Router 配置
│   │   ├── assets/          # 静态资源
│   │   └── App.vue
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                  # Express 后端 (独立 package.json)
│   ├── config/              # 数据库连接、环境变量
│   ├── models/              # Sequelize 模型
│   ├── migrations/          # 数据库迁移文件
│   ├── routes/              # Express 路由
│   ├── middleware/           # 中间件 (验证、错误处理)
│   ├── app.js               # Express 应用入口
│   └── package.json
└── SPEC.md
```

## Database Design

### Table: `todos`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 主键 |
| title | VARCHAR(255) | NOT NULL, UNIQUE | 任务标题，不允许重复 |
| is_completed | BOOLEAN | NOT NULL, DEFAULT false | 完成状态 |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | 创建时间 |
| updated_at | DATETIME | NOT NULL, DEFAULT NOW ON UPDATE | 更新时间 |
| deleted_at | DATETIME | NULL | 软删除时间戳 |

**Indexes:**
- `idx_is_completed` on `is_completed` (筛选查询)
- `idx_deleted_at` on `deleted_at` (过滤已删除记录)
- `unique_title` on `title` (唯一约束，业务层 + 数据库双重保障)

**Sequelize 配置:**
- 使用 `paranoid: true` 启用软删除
- 使用 Migration 管理数据库结构变更

## API Design

Base URL: `http://localhost:3000/api`

所有响应统一格式:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

错误响应:
```json
{
  "success": false,
  "message": "错误描述",
  "errors": [{ "field": "title", "message": "不能为空" }]
}
```

### Endpoints

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| GET | /todos | 获取任务列表 | Query: `?status=all\|active\|completed` |
| GET | /todos/:id | 获取单个任务 | - |
| POST | /todos | 创建任务 | `{ title: string }` |
| PUT | /todos/:id | 更新任务 | `{ title?: string, is_completed?: boolean }` |
| DELETE | /todos/:id | 软删除任务 | - |
| POST | /todos/batch/delete | 批量软删除 | `{ ids: number[] }` |
| POST | /todos/batch/complete | 批量标记完成 | `{ ids: number[] }` |

### 筛选逻辑

- `status=all`: 返回所有未删除任务 (默认)
- `status=active`: 返回 `is_completed=false` 且未删除
- `status=completed`: 返回 `is_completed=true` 且未删除

### 排序规则

- 按 `created_at DESC` 排序 (最新在前)
- 已完成任务保持原位，不自动下沉

## Input Validation

### 前端校验 (即时反馈)
- 标题不能为空 (trim 后长度 > 0)
- 标题最大 255 字符
- 禁用提交按钮直到输入有效

### 后端校验 (express-validator)
- 标题: `trim()`, `notEmpty()`, `isLength({ max: 255 })`
- 唯一性检查: 查询数据库确认标题不重复 (排除已软删除的记录)
- 返回 422 状态码 + 详细错误信息

## Frontend Architecture

### Pages / Routes

| Path | View | Description |
|------|------|-------------|
| / | TodoListView | 主页面，任务列表 + 操作 |

单页面应用，只有一个主视图。

### Components

```
TodoListView (页面容器)
├── TodoHeader          # 标题 + 任务统计
├── TodoInput           # 新建任务输入框 (回车提交)
├── TodoFilters         # 筛选 Tab: 全部/进行中/已完成
├── TodoList            # 任务列表容器
│   └── TodoItem        # 单个任务 (勾选框 + 标题 + 删除按钮 + 拖拽手柄)
├── TodoBatchBar        # 批量操作栏 (选中后显示: 全选/批量删除/批量完成)
└── Toast               # 全局 Toast 提示组件
```

### Pinia Store (`useTodoStore`)

```javascript
// State
todos: Todo[]           // 任务列表
filter: 'all' | 'active' | 'completed'  // 当前筛选
loading: boolean        // 加载状态
error: string | null    // 错误信息

// Getters
filteredTodos           // 根据 filter 返回对应列表
totalCount              // 总任务数
activeCount             // 未完成任务数
completedCount          // 已完成任务数

// Actions
fetchTodos(status)      // GET /todos?status=...
addTodo(title)          // POST /todos
updateTodo(id, data)    // PUT /todos/:id
deleteTodo(id)          # DELETE /todos/:id
batchDelete(ids)        // POST /todos/batch/delete
batchComplete(ids)      // POST /todos/batch/complete
```

### 交互细节

**添加任务:**
- 输入框回车提交
- 成功后清空输入框，新任务出现在列表顶部
- 标题重复时 Toast 提示 "任务标题已存在"
- 空标题不允许提交

**完成任务:**
- 点击勾选框切换完成状态
- 完成后样式: 文字划线 + 灰色
- 保持原位，不自动排序到底部

**删除任务:**
- 点击删除按钮直接删除 (无确认弹窗)
- Toast 提示 "任务已删除"
- 支持软删除，数据不物理删除

**拖拽排序:**
- 使用 VueDraggable (基于 SortableJS)
- 仅前端排序，不持久化到数据库
- 刷新后按默认排序 (created_at DESC)

**批量操作:**
- 每个任务左侧显示复选框
- 选中后底部出现操作栏: 全选 | 已选 N 项 | 批量删除 | 批量完成
- 批量删除: 无确认弹窗
- 批量完成: 将选中任务标记为已完成

**筛选:**
- Tab 切换: 全部 / 进行中 / 已完成
- 切换时调用 API 获取对应数据
- 当前筛选状态高亮显示

**Toast 提示:**
- 操作成功/失败时显示
- 3 秒自动消失
- 位置: 页面顶部居中
- 类型: success (绿色) / error (红色)

## Backend Architecture

### Middleware

1. **Morgan** - HTTP 请求日志 (dev 模式)
2. **cors** - 允许前端开发服务器跨域访问
3. **express.json()** - JSON body parser
4. **express-validator** - 请求参数校验
5. **错误处理中间件** - 统一错误响应格式

### Route Handler 流程

```
Request → CORS → JSON Parser → Route → Validator → Controller → Sequelize → Response
                                                       ↓
                                              Error Handler (统一格式)
```

### Sequelize Model 定义

```javascript
// models/todo.js
const Todo = sequelize.define('Todo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  is_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  paranoid: true,        // 启用软删除 (deleted_at)
  timestamps: true,      // 自动管理 created_at, updated_at
  underscored: true,     // 使用 snake_case 字段名
});
```

### 数据库初始化

- 使用 Sequelize CLI 执行 migration
- Migration 文件: `server/migrations/`
- 初始化命令: `npx sequelize-cli db:migrate`

## Error Handling

### 后端

- 所有路由用 try-catch 包裹
- Sequelize 验证错误返回 422 + 字段级错误信息
- 唯一约束冲突返回 422 + "任务标题已存在"
- 未捕获错误返回 500 + "服务器内部错误"
- 错误详情记录到 console

### 前端

- API 调用统一在 store action 中 try-catch
- 网络错误 Toast 提示 "网络错误，请检查连接"
- 业务错误 (422) Toast 提示后端返回的 message
- 加载状态: 请求时显示 loading 指示器

## Development Environment

### 前端 (client/)
- `npm run dev` → Vite dev server on `http://localhost:5173`
- HMR (Hot Module Replacement) 自动重载

### 后端 (server/)
- `npm run dev` → nodemon 监听文件变化自动重启
- 默认端口 `http://localhost:3000`

### CORS 配置

```javascript
// 开发环境: 允许 localhost:5173
// 生产环境: 同源 (Express 托管前端静态文件)
```

## Deployment

### 裸机部署流程

1. 服务器安装 Node.js 18+ 和 MySQL 8.x
2. 克隆代码到服务器
3. 前端: `cd client && npm install && npm run build`
4. 后端: `cd server && npm install`
5. 配置 `.env` (数据库连接信息)
6. 执行 migration: `npx sequelize-cli db:migrate`
7. Express 托管前端静态文件:
   ```javascript
   app.use(express.static('../client/dist'));
   ```
8. 使用 PM2 管理后端进程: `pm2 start app.js`
9. 访问 `http://server-ip:3000`

### 环境变量 (.env)

```
# server/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=todolist
DB_USER=root
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=production
```

## Out of Scope (不包含)

以下功能明确不在本项目范围内:

- 用户认证/注册/登录
- 多人协作/任务分配
- 任务描述/详情字段
- 标签/分类系统
- 截止日期/优先级
- 附件上传
- 实时同步 (WebSocket)
- 离线缓存
- 自动备份
- 测试套件
- GraphQL API
- Docker 部署
- 深层级嵌套任务

## Implementation Phases

### Phase 1: 项目初始化
- 创建目录结构
- 初始化前后端 package.json
- 配置 Vite + Tailwind CSS
- 配置 Express + Sequelize
- 编写数据库 migration
- 配置 CORS

### Phase 2: 后端 API
- Sequelize Model 定义
- CRUD 路由实现
- 输入验证 (express-validator)
- 错误处理中间件
- 统一响应格式

### Phase 3: 前端基础
- Vue Router 配置
- Pinia Store 实现
- API 请求封装 (axios)
- TodoInput 组件
- TodoItem 组件
- TodoList 组件

### Phase 4: 交互增强
- 筛选 Tab (TodoFilters)
- 批量操作 (TodoBatchBar)
- 拖拽排序 (VueDraggable)
- Toast 提示组件
- Loading 状态

### Phase 5: 部署准备
- 生产环境配置
- Express 托管静态文件
- PM2 进程管理配置
