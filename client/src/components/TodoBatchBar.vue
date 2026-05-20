<template>
  <div class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
    <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        :checked="allSelected"
        @change="$emit('toggleAll')"
        class="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
      />
      全选
    </label>
    <span class="text-sm text-gray-500">已选 {{ selectedCount }} 项</span>
    <div class="flex-1" />
    <button
      @click="$emit('batchComplete')"
      :disabled="selectedCount === 0"
      class="px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      批量完成
    </button>
    <button
      @click="$emit('batchDelete')"
      :disabled="selectedCount === 0"
      class="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      批量删除
    </button>
  </div>
</template>

<script setup>
defineProps({
  selectedCount: { type: Number, default: 0 },
  allSelected: { type: Boolean, default: false },
})

defineEmits(['toggleAll', 'batchComplete', 'batchDelete'])
</script>
