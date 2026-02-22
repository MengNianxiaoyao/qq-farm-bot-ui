<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
    <RouterView />
  </div>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: 'DM Sans', sans-serif;
}
</style>
