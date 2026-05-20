# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal TodoList web application with Vue 3 frontend and Express.js backend. Single-user, no authentication, flat task list with batch operations and drag-and-drop sorting.

**Tech Stack:**
- Frontend: Vue 3 (Composition API) + Pinia + Vue Router + Tailwind CSS + Vite
- Backend: Express.js + Sequelize ORM + MySQL 8.x

## Development Commands

### Frontend (client/)
```bash
cd client
npm install
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

### Backend (server/)
```bash
cd server
npm install
npm run dev          # nodemon on http://localhost:3000
npm start            # node app.js (production)
npm run db:migrate   # Run Sequelize migrations
npm run db:migrate:undo  # Undo last migration
```

### Database Setup
Requires MySQL 8.x running locally. Create a `server/.env` file:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=todolist
DB_USER=root
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
```

Then run migrations: `cd server && npm run db:migrate`

## Architecture

### Frontend Architecture

**State Management (Pinia):**
- `stores/todo.js` - Single store for all todo operations
- State: `todos[]`, `filter` ('all'|'active'|'completed'), `loading`, `error`
- Actions handle API calls and optimistic local state updates
- Filter changes trigger full API re-fetch with status parameter

**API Layer (`api/index.js`):**
- Axios instance with baseURL `/api`
- Functions: `fetchTodos()`, `createTodo()`, `updateTodo()`, `deleteTodo()`, `batchDeleteTodos()`, `batchCompleteTodos()`

**Data Flow Pattern:**
1. User action → Store action → API call
2. On success: Store updates local state (e.g., `todos = [newItem, ...todos]`)
3. On error: Store sets `error` state, view shows Toast
4. Filter changes call `fetchTodos(filter)` with query param

**Components:**
- `TodoListView.vue` - Page container, manages `selectedIds` for batch operations
- `TodoList.vue` - Renders list with VueDraggable for drag-and-drop
- `TodoItem.vue` - Individual task row (checkbox, title, delete)
- `TodoInput.vue` - New task input (Enter to submit)
- `TodoFilters.vue` - Status tabs (全部/进行中/已完成)
- `TodoBatchBar.vue` - Batch operations bar (appears when items selected)
- `Toast.vue` - Global feedback messages

**Drag-and-Drop:**
- Uses `vuedraggable` (SortableJS wrapper)
- `reorderTodos()` action updates local order only (not persisted to DB)
- Refresh reverts to default sort (`created_at DESC`)

### Backend Architecture

**API Routes (`routes/todos.js`):**
All routes under `/api/todos` with consistent response format:
```json
{ "success": true, "data": {}, "message": "..." }
```

| Endpoint | Description |
|----------|-------------|
| GET /todos?status= | List (status: all/active/completed) |
| GET /todos/:id | Get single todo |
| POST /todos | Create (body: { title }) |
| PUT /todos/:id | Update (body: { title?, is_completed? }) |
| DELETE /todos/:id | Soft delete |
| POST /todos/batch/delete | Batch soft delete (body: { ids }) |
| POST /todos/batch/complete | Batch complete (body: { ids }) |

**Database (Sequelize):**
- `models/todo.js` - Todo model with `paranoid: true` for soft deletes
- `config/sequelize.js` - Sequelize instance with `underscored: true` (snake_case fields)
- `migrations/` - Database schema migrations

**Validation:**
- Uses `express-validator` in route handlers
- Title: trim, notEmpty, max 255 chars
- Unique constraint on title (DB-level + business logic)
- Validation errors return 422 with field-level details

**Error Handling:**
- `middleware/errorHandler.js` - Centralized error handler
- All routes wrapped in try-catch, pass errors to `next(err)`
- Consistent error format: `{ success: false, message, errors? }`

## Key Implementation Details

### Soft Deletes
- Database: `deleted_at` timestamp column (managed by Sequelize `paranoid: true`)
- Queries automatically exclude soft-deleted records
- Unique constraint on `title` excludes soft-deleted (allows re-adding deleted titles)

### Sorting Behavior
- API returns todos sorted by `created_at DESC` (newest first)
- Completed tasks stay in position (no auto-sort to bottom)
- Frontend drag reorder is temporary only

### Batch Operations
- Selection state managed in `TodoListView.vue` (`selectedIds` array)
- Batch API calls accept `ids: number[]`
- After batch delete/complete, clear selection and refresh list

### Production Deployment
- `NODE_ENV=production`: Express serves static files from `../client/dist`
- Single-server deployment (Express handles both API and frontend)
- PM2 config in `ecosystem.config.js`

## File Conventions

- Frontend uses ES modules (`type: "module"` in package.json)
- Backend uses CommonJS (`require`)
- Vue components use `<script setup>` + Composition API
- API response wrapper is mandatory for all endpoints
- Immutable updates in Pinia store (spread operator, filter, map)
