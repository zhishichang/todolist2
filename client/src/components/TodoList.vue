<template>
  <div>
    <div v-if="loading" class="text-center py-8 text-gray-500">
      加载中...
    </div>
    <div v-else-if="todos.length === 0" class="text-center py-8 text-gray-400">
      暂无任务
    </div>
    <draggable
      v-else
      :list="todos"
      item-key="id"
      handle=".cursor-grab"
      ghost-class="opacity-50"
      @end="onDragEnd"
      class="flex flex-col gap-2"
    >
      <template #item="{ element }">
        <TodoItem
          :todo="element"
          :selected="selectedIds.includes(element.id)"
          @toggle="$emit('toggle', $event)"
          @delete="$emit('delete', $event)"
          @select="$emit('select', $event)"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import TodoItem from './TodoItem.vue'

const props = defineProps({
  todos: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'delete', 'select', 'reorder'])

function onDragEnd() {
  emit('reorder', props.todos.map((t) => t.id))
}
</script>
