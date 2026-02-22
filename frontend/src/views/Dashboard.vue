<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useStatusStore } from '@/stores/status'

const statusStore = useStatusStore()
const accountStore = useAccountStore()
const { status, logs, error } = storeToRefs(statusStore)
const { currentAccountId } = storeToRefs(accountStore)
const logContainer = ref<HTMLElement | null>(null)
let timer: any = null

function getLogTagClass(tag: string) {
  if (tag === '错误')
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (tag === '系统')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (tag === '警告')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
}

function getLogMsgClass(tag: string) {
  if (tag === '错误')
    return 'text-red-600 dark:text-red-400'
  return 'text-gray-700 dark:text-gray-300'
}

function formatLogTime(timeStr: string) {
  // 2024/5/20 12:34:56 -> 12:34:56
  if (!timeStr)
    return ''
  const parts = timeStr.split(' ')
  return parts.length > 1 ? parts[1] : timeStr
}

function getOpName(key: string | number) {
  const map: Record<string, string> = {
    harvest: '收获',
    water: '浇水',
    weed: '除草',
    bug: '除虫',
    fertilize: '施肥',
    plant: '种植',
    steal: '偷菜',
    helpWater: '帮浇',
    helpWeed: '帮草',
    helpBug: '帮虫',
    taskClaim: '任务',
    sell: '出售',
    upgrade: '升级',
  }
  return map[String(key)] || String(key)
}

function getExpPercent(p: any) {
  if (!p || !p.needed)
    return 0
  return Math.min(100, Math.max(0, (p.current / p.needed) * 100))
}

function refresh() {
  if (currentAccountId.value) {
    statusStore.fetchStatus(currentAccountId.value)
    statusStore.fetchLogs(currentAccountId.value)
  }
}

watch(currentAccountId, () => {
  refresh()
})

// Auto scroll logs
watch(logs, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}, { deep: true })

onMounted(() => {
  refresh()
  // Auto refresh every 5s
  timer = setInterval(refresh, 5000)
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Alert -->
    <div v-if="error" class="mb-4 flex items-center gap-2 border border-red-200 rounded-lg bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
      <div class="i-carbon-warning-filled text-xl" />
      <span>{{ error }}</span>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
      <!-- 昵称 & 等级 -->
      <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="mb-2 flex items-start justify-between">
          <div class="text-sm text-gray-500">
            账号
          </div>
          <div class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Lv.{{ status?.status?.level || 0 }}
          </div>
        </div>
        <div class="mb-1 truncate text-xl font-bold" :title="status?.status?.nick || status?.status?.name">
          {{ status?.status?.nick || status?.status?.name || '未命名' }}
        </div>
        <div class="text-xs text-gray-400">
          运行时长: {{ status?.uptime || '0:00' }}
        </div>

        <!-- Level Progress -->
        <div class="mt-3">
          <div class="mb-1 flex justify-between text-xs text-gray-500">
            <span>EXP</span>
            <span>{{ status?.levelProgress?.current || 0 }} / {{ status?.levelProgress?.needed || '?' }}</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              class="h-full rounded-full bg-blue-500 transition-all duration-500"
              :style="{ width: `${getExpPercent(status?.levelProgress)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- 金币 -->
      <div class="flex flex-col justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="text-sm text-gray-500">
          金币
        </div>
        <div class="text-2xl text-yellow-600 font-bold dark:text-yellow-500">
          {{ status?.status?.gold || 0 }}
        </div>
        <div class="mt-1 text-xs text-gray-400">
          本次收益: <span class="text-green-500">+{{ status?.sessionGoldGained || 0 }}</span>
        </div>
      </div>

      <!-- 点券 -->
      <div class="flex flex-col justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="text-sm text-gray-500">
          点券
        </div>
        <div class="text-2xl text-blue-600 font-bold dark:text-blue-500">
          {{ status?.status?.coupon || 0 }}
        </div>
        <div class="mt-1 text-xs text-gray-400">
          本次收益: <span class="text-green-500">+{{ status?.sessionCouponGained || 0 }}</span>
        </div>
      </div>

      <!-- 状态 -->
      <div class="flex flex-col justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="text-sm text-gray-500">
          状态
        </div>
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-full" :class="status?.connection?.connected ? 'bg-green-500' : 'bg-red-500'" />
          <div class="font-bold">
            {{ status?.connection?.connected ? '在线' : '离线' }}
          </div>
        </div>
        <div class="mt-1 truncate text-xs text-gray-400">
          {{ status?.lastOperation || '暂无操作' }}
        </div>
      </div>
    </div>

    <!-- Operations Grid -->
    <div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h3 class="mb-4 flex items-center gap-2 text-lg font-medium">
        <div class="i-carbon-activity" />
        <span>今日统计</span>
      </h3>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-8 md:grid-cols-6 sm:grid-cols-4">
        <div v-for="(val, key) in (status?.operations || {})" :key="key" class="rounded bg-gray-50 p-3 text-center dark:bg-gray-700/30">
          <div class="mb-1 text-xs text-gray-500">
            {{ getOpName(key) }}
          </div>
          <div class="text-lg font-bold">
            {{ val }}
          </div>
        </div>
      </div>
    </div>

    <!-- Logs -->
    <div class="h-[400px] flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h3 class="mb-4 flex items-center gap-2 text-lg font-medium">
        <div class="i-carbon-document" />
        <span>运行日志</span>
      </h3>
      <div ref="logContainer" class="flex-1 overflow-y-auto rounded bg-gray-50 p-4 text-sm leading-relaxed font-mono dark:bg-gray-900">
        <div v-if="!logs.length" class="py-8 text-center text-gray-400">
          暂无日志
        </div>
        <div v-for="log in logs" :key="log.ts" class="mb-1 break-all">
          <span class="mr-2 select-none text-gray-400">[{{ formatLogTime(log.time) }}]</span>
          <span class="mr-2 rounded px-1.5 py-0.5 text-xs font-bold" :class="getLogTagClass(log.tag)">{{ log.tag }}</span>
          <span :class="getLogMsgClass(log.tag)">{{ log.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
