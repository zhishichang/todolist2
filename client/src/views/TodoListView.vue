<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <TodoHeader
        :total-count="store.totalCount"
        :active-count="store.activeCount"
        :completed-count="store.completedCount"
      />

      <TodoInput @add="handleAdd" />

      <TodoFilters
        :model-value="store.filter"
        @change="handleFilterChange"
      />

      <TodoBatchBar
        v-if="store.todos.length > 0"
        :selected-count="selectedIds.length"
        :all-selected="isAllSelected"
        @toggle-all="handleToggleAll"
        @batch-complete="handleBatchComplete"
        @batch-delete="handleBatchDelete"
      />

      <TodoList
        :todos="store.filteredTodos"
        :selected-ids="selectedIds"
        :loading="store.loading"
        @toggle="handleToggle"
        @delete="handleDelete"
        @select="handleSelect"
        @reorder="handleReorder"
      />

      <Toast ref="toastRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTodoStore } from '../stores/todo'
import TodoHeader from '../components/TodoHeader.vue'
import TodoInput from '../components/TodoInput.vue'
import TodoFilters from '../components/TodoFilters.vue'
import TodoBatchBar from '../components/TodoBatchBar.vue'
import TodoList from '../components/TodoList.vue'
import Toast from '../components/Toast.vue'

const store = useTodoStore()
const toastRef = ref(null)
const selectedIds = ref([])

const isAllSelected = computed(() => {
  return store.todos.length > 0 && selectedIds.value.length === store.todos.length
})

function showToast(message, type = 'success') {
  toastRef.value?.showToast(message, type)
}

async function loadTodos() {
  try {
    await store.fetchTodos()
  } catch {
    showToast(store.error, 'error')
  }
}

async function handleAdd(title) {
  try {
    await store.addTodo(title)
    showToast('任务创建成功')
  } catch {
    showToast(store.error, 'error')
  }
}

async function handleToggle(id) {
  const todo = store.todos.find((t) => t.id === id)
  if (!todo) return
  try {
    await store.updateTodo(id, { is_completed: !todo.is_completed })
  } catch {
    showToast(store.error, 'error')
  }
}

async function handleDelete(id) {
  try {
    await store.deleteTodo(id)
    selectedIds.value = selectedIds.value.filter((sid) => sid !== id)
    showToast('任务已删除')
  } catch {
    showToast(store.error, 'error')
  }
}

function handleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((sid) => sid !== id)
  }
}

function handleToggleAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = store.todos.map((t) => t.id)
  }
}

async function handleBatchComplete() {
  if (selectedIds.value.length === 0) return
  try {
    await store.batchComplete(selectedIds.value)
    selectedIds.value = []
    showToast('批量完成成功')
  } catch {
    showToast(store.error, 'error')
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  try {
    await store.batchDelete(selectedIds.value)
    selectedIds.value = []
    showToast('批量删除成功')
  } catch {
    showToast(store.error, 'error')
  }
}

function handleReorder(orderedIds) {
  store.reorderTodos(orderedIds)
}

async function handleFilterChange(filter) {
  store.setFilter(filter)
  selectedIds.value = []
  await loadTodos()
}

onMounted(loadTodos)
</script>
