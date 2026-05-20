<template>
  <form @submit.prevent="handleSubmit" class="mb-4">
    <div class="flex gap-2">
      <input
        v-model.trim="title"
        type="text"
        placeholder="添加新任务..."
        maxlength="255"
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        :disabled="!title"
        class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        添加
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])
const title = ref('')

function handleSubmit() {
  if (!title.value) return
  emit('add', title.value)
  title.value = ''
}
</script>
