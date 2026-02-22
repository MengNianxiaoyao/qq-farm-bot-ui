<script setup lang="ts">
const model = defineModel<boolean>()
defineProps<{
  label?: string
}>()
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-3">
    <div class="relative inline-flex items-center">
      <input type="checkbox" v-model="model" class="peer sr-only">
      <div class="h-6 w-11 rounded-full bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500/20 dark:bg-gray-700 peer-checked:bg-green-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:border after:border-gray-300 after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600"></div>
    </div>
    <span v-if="label" class="select-none text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </span>
  </label>
</template>
