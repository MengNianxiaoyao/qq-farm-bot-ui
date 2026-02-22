<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useFarmStore } from '@/stores/farm'
import { useStatusStore } from '@/stores/status'

const farmStore = useFarmStore()
const accountStore = useAccountStore()
const statusStore = useStatusStore()
const { lands, summary, loading } = storeToRefs(farmStore)
const { currentAccountId } = storeToRefs(accountStore)
const { status, loading: statusLoading } = storeToRefs(statusStore)

const operating = ref(false)

function getLandTypeName(level: number) {
  const map: Record<number, string> = {
    0: '未解锁',
    1: '黄土地',
    2: '红土地',
    3: '黑土地',
    4: '金土地',
  }
  return map[Math.max(0, Math.min(4, Number(level) || 0))] || '土地'
}

function getLandStatusClass(land: any) {
  const status = land.status
  if (status === 'locked')
    return 'bg-gray-100 dark:bg-gray-800 opacity-60'
  if (status === 'empty')
    return 'bg-white dark:bg-gray-800'
  if (status === 'harvestable')
    return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
  if (status === 'growing')
    return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
  if (status === 'dead')
    return 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
  if (status === 'stealable')
    return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800'
  return 'bg-white dark:bg-gray-800'
}

function formatTime(sec: number) {
  if (sec <= 0)
    return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

async function handleOperate(opType: string) {
  if (!currentAccountId.value)
    return
  operating.value = true
  await farmStore.operate(currentAccountId.value, opType)
  operating.value = false
}

function refresh() {
  if (currentAccountId.value) {
    farmStore.fetchLands(currentAccountId.value)
    statusStore.fetchStatus(currentAccountId.value)
  }
}

watch(currentAccountId, () => {
  refresh()
})

const { pause, resume } = useIntervalFn(() => {
  if (lands.value) {
    lands.value.forEach((l: any) => {
      if (l.matureInSec > 0)
        l.matureInSec--
    })
  }
}, 1000)

onMounted(() => {
  refresh()
  resume()
})

onUnmounted(() => {
  pause()
})
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="rounded-lg bg-white shadow dark:bg-gray-800">
      <!-- Header with Title and Actions -->
      <div class="flex flex-col items-center justify-between gap-4 border-b border-gray-100 p-4 sm:flex-row dark:border-gray-700">
        <h3 class="flex items-center gap-2 text-lg font-bold">
          <div i-carbon-grid class="text-xl" />
          土地详情
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700 disabled:opacity-50"
            :disabled="operating"
            @click="handleOperate('harvest')"
          >
            收获
          </button>
          <button
            class="rounded bg-gray-600 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700 disabled:opacity-50"
            :disabled="operating"
            @click="handleOperate('clear')"
          >
            除草/虫
          </button>
          <button
            class="rounded bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700 disabled:opacity-50"
            :disabled="operating"
            @click="handleOperate('plant')"
          >
            种植
          </button>
          <button
            class="rounded bg-purple-600 px-3 py-1.5 text-sm text-white transition hover:bg-purple-700 disabled:opacity-50"
            :disabled="operating"
            @click="handleOperate('upgrade')"
          >
            升级土地
          </button>
          <button
            class="rounded bg-orange-600 px-3 py-1.5 text-sm text-white transition hover:bg-orange-700 disabled:opacity-50"
            :disabled="operating"
            @click="handleOperate('all')"
          >
            一键全收
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="flex flex-wrap gap-4 border-b border-gray-100 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-900/50">
        <div class="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          <div class="i-carbon-agriculture-analytics" />
          <span class="font-medium">可收: {{ summary?.harvestable || 0 }}</span>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <div class="i-carbon-sprout" />
          <span class="font-medium">生长: {{ summary?.growing || 0 }}</span>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <div class="i-carbon-checkbox" />
          <span class="font-medium">空闲: {{ summary?.empty || 0 }}</span>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <div class="i-carbon-warning" />
          <span class="font-medium">枯萎: {{ summary?.dead || 0 }}</span>
        </div>
      </div>

      <!-- Grid -->
      <div class="p-4">
        <div v-if="loading || statusLoading" class="flex justify-center py-12">
          <div class="i-svg-spinners-90-ring-with-bg text-4xl text-blue-500" />
        </div>

        <div v-else-if="!status?.connection?.connected" class="flex flex-col items-center justify-center gap-4 rounded-lg bg-white p-12 text-center text-gray-500 shadow dark:bg-gray-800">
          <div class="i-carbon-connection-signal-off text-4xl text-gray-400" />
          <div>
            <div class="text-lg text-gray-700 font-medium dark:text-gray-300">
              账号未登录
            </div>
            <div class="mt-1 text-sm text-gray-400">
              请先运行账号或检查网络连接
            </div>
          </div>
        </div>

        <div v-else-if="!lands || lands.length === 0" class="flex justify-center py-12 text-gray-500">
          暂无土地数据
        </div>

        <div v-else class="grid grid-cols-2 gap-4 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3">
          <div
            v-for="land in lands"
            :key="land.id"
            class="relative min-h-[140px] flex flex-col items-center border rounded-lg p-2 transition dark:border-gray-700 hover:shadow-md"
            :class="getLandStatusClass(land)"
          >
            <div class="absolute left-1 top-1 text-[10px] text-gray-400 font-mono">
              #{{ land.id }}
            </div>

            <div class="mb-1 mt-4 h-10 w-10 flex items-center justify-center">
              <img
                v-if="land.seedImage"
                :src="land.seedImage"
                class="max-h-full max-w-full object-contain"
                loading="lazy"
                referrerpolicy="no-referrer"
              >
              <div v-else class="i-carbon-sprout text-xl text-gray-300" />
            </div>

            <div class="w-full truncate px-1 text-center text-xs font-bold" :title="land.plantName">
              {{ land.plantName || '-' }}
            </div>

            <div class="mb-0.5 mt-0.5 w-full text-center text-[10px] text-gray-500">
              <span v-if="land.matureInSec > 0" class="text-orange-500">
                {{ formatTime(land.matureInSec) }}后成熟
              </span>
              <span v-else>
                {{ land.phaseName || (land.status === 'locked' ? '未解锁' : '未开垦') }}
              </span>
            </div>

            <div class="mb-1 text-[10px] text-gray-400">
              {{ getLandTypeName(land.level) }}
            </div>

            <!-- Status Badges -->
            <div class="mt-auto flex origin-bottom scale-90 gap-0.5 text-[10px]">
              <span v-if="land.needWater" class="rounded bg-blue-100 px-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">水</span>
              <span v-if="land.needWeed" class="rounded bg-green-100 px-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">草</span>
              <span v-if="land.needBug" class="rounded bg-red-100 px-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-400">虫</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
