<template>
  <div class="text-center mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">TodoList</h1>
    <p class="text-sm text-gray-500">
      共 {{ totalCount }} 项，{{ activeCount }} 项未完成，{{ completedCount }} 项已完成
    </p>
  </div>
</template>

<script setup>
defineProps({
  totalCount: { type: Number, default: 0 },
  activeCount: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
})
</script>
