<script setup lang="ts">
const model = defineModel<string>()
defineProps<{
  placeholder?: string
  label?: string
  disabled?: boolean
  rows?: number
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </label>
    <textarea
      v-model="model"
      :rows="rows || 3"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-green-500 dark:disabled:bg-gray-800/50"
    />
  </div>
</template>
