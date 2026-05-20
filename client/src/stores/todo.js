import { defineStore } from 'pinia'
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  batchDeleteTodos,
  batchCompleteTodos,
} from '../api'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [],
    filter: 'all',
    loading: false,
    error: null,
  }),

  getters: {
    filteredTodos: (state) => state.todos,

    totalCount: (state) => state.todos.length,

    activeCount: (state) => state.todos.filter((t) => !t.is_completed).length,

    completedCount: (state) => state.todos.filter((t) => t.is_completed).length,
  },

  actions: {
    async fetchTodos() {
      this.loading = true
      this.error = null
      try {
        const { data: res } = await fetchTodos(this.filter)
        this.todos = res.data
      } catch (err) {
        this.error = err.response?.data?.message || '网络错误，请检查连接'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addTodo(title) {
      this.error = null
      try {
        const { data: res } = await createTodo(title)
        this.todos = [res.data, ...this.todos]
        return res
      } catch (err) {
        this.error = err.response?.data?.message || '网络错误，请检查连接'
        throw err
      }
    },

    async updateTodo(id, data) {
      this.error = null
      try {
        const { data: res } = await updateTodo(id, data)
        this.todos = this.todos.map((t) => (t.id === id ? res.data : t))
        return res
      } catch (err) {
        this.error = err.response?.data?.message || '网络错误，请检查连接'
        throw err
      }
    },

    async deleteTodo(id) {
      this.error = null
      try {
        await deleteTodo(id)
        this.todos = this.todos.filter((t) => t.id !== id)
      } catch (err) {
        this.error = err.response?.data?.message || '网络错误，请检查连接'
        throw err
      }
    },

    async batchDelete(ids) {
      this.error = null
      try {
        await batchDeleteTodos(ids)
        this.todos = this.todos.filter((t) => !ids.includes(t.id))
      } catch (err) {
        this.error = err.response?.data?.message || '网络错误，请检查连接'
        throw err
      }
    },

    async batchComplete(ids) {
      this.error = null
      try {
        await batchCompleteTodos(ids)
        this.todos = this.todos.map((t) =>
          ids.includes(t.id) ? { ...t, is_completed: true } : t
        )
      } catch (err) {
        this.error = err.response?.data?.message || '网络错误，请检查连接'
        throw err
      }
    },

    reorderTodos(orderedIds) {
      const todoMap = new Map(this.todos.map((t) => [t.id, t]))
      this.todos = orderedIds.map((id) => todoMap.get(id)).filter(Boolean)
    },

    setFilter(filter) {
      this.filter = filter
    },
  },
})
