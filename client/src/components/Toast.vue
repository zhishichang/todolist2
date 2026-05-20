<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'px-4 py-2 rounded shadow-lg text-sm font-medium',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
          ]"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

function showToast(message, type = 'success') {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message, type }]
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

defineExpose({ showToast })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
