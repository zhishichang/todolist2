<template>
  <div class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
    <span class="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 select-none">⠿</span>
    <input
      type="checkbox"
      :checked="selected"
      @change="$emit('select', todo.id)"
      class="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
    />
    <input
      type="checkbox"
      :checked="todo.is_completed"
      @change="$emit('toggle', todo.id)"
      class="w-5 h-5 text-green-500 rounded focus:ring-green-500"
    />
    <span
      :class="[
        'flex-1 text-sm',
        todo.is_completed ? 'line-through text-gray-400' : 'text-gray-900',
      ]"
    >
      {{ todo.title }}
    </span>
    <button
      @click="$emit('delete', todo.id)"
      class="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
    >
      删除
    </button>
  </div>
</template>

<script setup>
defineProps({
  todo: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

defineEmits(['toggle', 'delete', 'select'])
</script>
