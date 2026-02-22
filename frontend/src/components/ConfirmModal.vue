<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'primary'
  isAlert?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity" @click="emit('cancel')">
    <div class="max-w-sm w-full scale-100 transform rounded-xl bg-white p-6 shadow-2xl transition-all dark:bg-gray-800" @click.stop>
      <h3 class="mb-3 text-xl text-gray-900 font-bold dark:text-gray-100">
        {{ title || '确认操作' }}
      </h3>
      <p class="mb-8 text-gray-600 leading-relaxed dark:text-gray-400">
        {{ message || '确定要执行此操作吗？' }}
      </p>
      <div class="flex justify-end gap-3">
        <button
          v-if="!isAlert"
          :disabled="loading"
          class="rounded-lg px-5 py-2.5 text-sm text-gray-600 font-medium transition-colors disabled:cursor-not-allowed hover:bg-gray-100 dark:text-gray-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:bg-gray-700"
          @click="emit('cancel')"
        >
          {{ cancelText || '取消' }}
        </button>
        <button
          :disabled="loading"
          class="min-w-[80px] flex items-center justify-center rounded-lg px-5 py-2.5 text-sm text-white font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="type === 'primary' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'"
          @click="emit('confirm')"
        >
          <div v-if="loading" class="i-svg-spinners-ring-resize mr-2 animate-spin" />
          {{ confirmText || '确定' }}
        </button>
      </div>
    </div>
  </div>
</template>
