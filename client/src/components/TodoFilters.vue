<template>
  <div class="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      @click="$emit('change', tab.value)"
      :class="[
        'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
        modelValue === tab.value
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: 'all' },
})

defineEmits(['change'])

const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
]
</script>
