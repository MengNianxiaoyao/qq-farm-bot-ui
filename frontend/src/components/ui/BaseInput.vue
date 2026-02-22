<script setup lang="ts">
import { ref, computed } from 'vue'

const model = defineModel<string | number>()
const props = defineProps<{
  type?: string
  placeholder?: string
  label?: string
  disabled?: boolean
}>()

const showPassword = ref(false)
const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }
  return props.type || 'text'
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </label>
    <div class="relative">
      <input
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-green-500 dark:disabled:bg-gray-800/50"
      >
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="showPassword = !showPassword"
      >
        <div v-if="showPassword" class="i-carbon-view-off" />
        <div v-else class="i-carbon-view" />
      </button>
    </div>
  </div>
</template>
