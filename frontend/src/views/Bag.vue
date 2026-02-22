<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useBagStore } from '@/stores/bag'

const accountStore = useAccountStore()
const bagStore = useBagStore()
const { currentAccountId } = storeToRefs(accountStore)
const { items, loading } = storeToRefs(bagStore)

function loadBag() {
  if (currentAccountId.value)
    bagStore.fetchBag(currentAccountId.value)
}

onMounted(() => {
  loadBag()
})

watch(currentAccountId, () => {
  loadBag()
})

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  target.closest('.thumb-wrap')?.classList.add('fallback')
}
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <div class="i-carbon-inventory-management" />
        背包
      </h2>
      <div v-if="items.length" class="text-sm text-gray-500">
        共 {{ items.length }} 种物品
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="i-svg-spinners-90-ring-with-bg text-4xl text-blue-500" />
    </div>

    <div v-else-if="!currentAccountId" class="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">
      请选择账号后查看背包
    </div>

    <div v-else-if="items.length === 0" class="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">
      无可展示物品
    </div>

    <div v-else class="grid grid-cols-2 gap-4 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 xl:grid-cols-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative flex flex-col items-center border rounded-lg bg-white p-3 transition dark:border-gray-700 dark:bg-gray-800 hover:shadow-md"
      >
        <div class="absolute left-2 top-2 text-xs text-gray-400 font-mono">
          #{{ item.id }}
        </div>

        <div
          class="thumb-wrap mb-2 mt-6 h-16 w-16 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700/50"
          :data-fallback="(item.name || '物').slice(0, 1)"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            class="max-h-full max-w-full object-contain"
            loading="lazy"
            @error="handleImageError"
          >
          <div v-else class="text-2xl text-gray-400 font-bold uppercase">
            {{ (item.name || '物').slice(0, 1) }}
          </div>
        </div>

        <div class="mb-1 w-full truncate px-2 text-center text-sm font-bold" :title="item.name">
          {{ item.name || `物品${item.id}` }}
        </div>

        <div class="mb-2 flex flex-col items-center gap-0.5 text-xs text-gray-400">
          <span v-if="item.uid">UID: {{ item.uid }}</span>
          <span>
            类型: {{ item.itemType || 0 }}
            <span v-if="item.level > 0"> · Lv{{ item.level }}</span>
            <span v-if="item.price > 0"> · {{ item.price }}金</span>
          </span>
        </div>

        <div class="mt-auto font-medium" :class="item.hoursText ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'">
          {{ item.hoursText || `x${item.count || 0}` }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumb-wrap.fallback img {
  display: none;
}
.thumb-wrap.fallback::after {
  content: attr(data-fallback);
  font-size: 1.5rem;
  font-weight: bold;
  color: #9ca3af;
  text-transform: uppercase;
}
</style>
