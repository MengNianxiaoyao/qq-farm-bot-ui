<script setup lang="ts">
const model = defineModel<boolean>()
defineProps<{
  label?: string
}>()
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2">
    <input
      v-model="model"
      type="checkbox"
      class="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
    >
    <span v-if="label" class="select-none text-sm text-gray-700 dark:text-gray-300">
      {{ label }}
    </span>
  </label>
</template>
