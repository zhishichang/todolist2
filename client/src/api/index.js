import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function fetchTodos(status = 'all') {
  return api.get('/todos', { params: { status } })
}

export function createTodo(title) {
  return api.post('/todos', { title })
}

export function updateTodo(id, data) {
  return api.put(`/todos/${id}`, data)
}

export function deleteTodo(id) {
  return api.delete(`/todos/${id}`)
}

export function batchDeleteTodos(ids) {
  return api.post('/todos/batch/delete', { ids })
}

export function batchCompleteTodos(ids) {
  return api.post('/todos/batch/complete', { ids })
}
