<script setup lang="ts">
import { useDateFormat, useNow } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api from '@/api'
import AccountModal from '@/components/AccountModal.vue'

import RemarkModal from '@/components/RemarkModal.vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const { accounts, currentAccount } = storeToRefs(accountStore)

const showAccountDropdown = ref(false)
const showAccountModal = ref(false)
const showRemarkModal = ref(false)
const accountToEdit = ref<any>(null)
const connected = ref(true)
const serverUptimeBase = ref(0)
const lastPingTime = ref(Date.now())
const now = useNow()
const formattedTime = useDateFormat(now, 'YYYY-MM-DD HH:mm:ss')

let timer: any = null

async function checkConnection() {
  try {
    const res = await api.get('/api/ping')
    connected.value = true
    if (res.data.ok && res.data.data.uptime) {
      serverUptimeBase.value = res.data.data.uptime
      lastPingTime.value = Date.now()
    }
  }
  catch {
    connected.value = false
  }
}

function handleAccountSaved() {
  accountStore.fetchAccounts()
  showAccountModal.value = false
  showRemarkModal.value = false
}

function openRemarkModal(acc: any) {
  accountToEdit.value = acc
  showRemarkModal.value = true
  showAccountDropdown.value = false
}

onMounted(() => {
  accountStore.fetchAccounts()
  checkConnection()
  timer = setInterval(checkConnection, 30000)
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
})

const uptime = computed(() => {
  const diff = Math.floor(serverUptimeBase.value + (now.value.getTime() - lastPingTime.value) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${h}h ${m}m ${s}s`
})

const navItems = [
  { path: '/', label: '概览', icon: 'i-carbon-chart-pie' },
  { path: '/farm', label: '农场', icon: 'i-carbon-sprout' },
  { path: '/bag', label: '背包', icon: 'i-carbon-box' },
  { path: '/friends', label: '好友', icon: 'i-carbon-user-multiple' },
  { path: '/accounts', label: '账号', icon: 'i-carbon-user-settings' },
  { path: '/analytics', label: '分析', icon: 'i-carbon-analytics' },
  { path: '/settings', label: '设置', icon: 'i-carbon-settings' },
]

function selectAccount(acc: any) {
  accountStore.setCurrentAccount(acc)
  showAccountDropdown.value = false
}
</script>

<template>
  <aside class="h-full w-64 flex flex-col border-r border-gray-200 bg-white transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
    <!-- Brand -->
    <div class="h-16 flex items-center gap-3 border-b border-gray-100 px-6 dark:border-gray-700/50">
      <div class="i-carbon-sprout text-2xl text-green-500" />
      <span class="from-green-600 to-emerald-500 bg-gradient-to-r bg-clip-text text-lg text-transparent font-bold">
        QQ农场助手
      </span>
    </div>

    <!-- Account Selector -->
    <div class="border-b border-gray-100 p-4 dark:border-gray-700/50">
      <div class="group relative">
        <button
          class="w-full flex items-center justify-between border border-transparent rounded-xl bg-gray-50 px-4 py-2.5 outline-none transition-all duration-200 hover:border-gray-200 dark:bg-gray-700/50 hover:bg-gray-100 focus:ring-2 focus:ring-green-500/20 dark:hover:border-gray-600 dark:hover:bg-gray-700"
          @click="showAccountDropdown = !showAccountDropdown"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="h-8 w-8 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-2 ring-white dark:bg-gray-600 dark:ring-gray-700">
              <img
                v-if="currentAccount?.uin"
                :src="`http://q1.qlogo.cn/g?b=qq&nk=${currentAccount.uin}&s=100`"
                class="h-full w-full object-cover"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              >
              <div v-else class="i-carbon-user text-gray-400" />
            </div>
            <div class="min-w-0 flex flex-col items-start">
              <span class="w-full truncate text-left text-sm font-medium">
                {{ currentAccount?.nick || currentAccount?.name || currentAccount?.uin || '选择账号' }}
              </span>
              <span class="w-full truncate text-left text-xs text-gray-400">
                {{ currentAccount?.uin || '未选择' }}
              </span>
            </div>
          </div>
          <div
            class="i-carbon-chevron-down text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': showAccountDropdown }"
          />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showAccountDropdown"
          class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden border border-gray-100 rounded-xl bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="custom-scrollbar max-h-60 overflow-y-auto">
            <template v-if="accounts.length > 0">
              <button
                v-for="acc in accounts"
                :key="acc.uin"
                class="w-full flex items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                :class="{ 'bg-green-50 dark:bg-green-900/10': currentAccount?.uin === acc.uin }"
                @click="selectAccount(acc)"
              >
                <div class="h-6 w-6 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                  <img
                    :src="`http://q1.qlogo.cn/g?b=qq&nk=${acc.uin}&s=100`"
                    class="h-full w-full object-cover"
                    @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                  >
                </div>
                <div class="min-w-0 flex flex-1 flex-col items-start">
                  <span class="w-full truncate text-left text-sm font-medium">{{ acc.nick }}</span>
                  <span class="text-xs text-gray-400">{{ acc.uin }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    class="rounded-full p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"
                    title="修改备注"
                    @click.stop="openRemarkModal(acc)"
                  >
                    <div class="i-carbon-edit" />
                  </button>
                  <div v-if="currentAccount?.uin === acc.uin" class="i-carbon-checkmark text-green-500" />
                </div>
              </button>
            </template>
            <div v-else class="px-4 py-3 text-center text-sm text-gray-400">
              暂无账号
            </div>
          </div>
          <div class="mt-1 border-t border-gray-100 pt-1 dark:border-gray-700">
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 transition-colors hover:bg-gray-50 dark:text-green-400 dark:hover:bg-gray-700/50"
              @click="showAccountModal = true; showAccountDropdown = false"
            >
              <div class="i-carbon-add" />
              <span>添加账号</span>
            </button>
            <router-link
              to="/accounts"
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 transition-colors hover:bg-gray-50 dark:text-green-400 dark:hover:bg-gray-700/50"
              @click="showAccountDropdown = false"
            >
              <div class="i-carbon-add-alt" />
              <span>管理账号</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        v-slot="{ href, navigate, isActive, isExactActive }"
        :to="item.path"
        custom
      >
        <a
          :href="href"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-all duration-200 hover:bg-gray-50 dark:text-gray-400 hover:text-green-600 dark:hover:bg-gray-700/50 dark:hover:text-green-400"
          :class="{
            'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 font-medium shadow-sm ring-1 ring-green-500/10': item.path === '/' ? isExactActive : isActive,
          }"
          @click="navigate"
        >
          <div class="text-xl transition-transform duration-200 group-hover:scale-110" :class="[item.icon]" />
          <span>{{ item.label }}</span>
        </a>
      </router-link>
    </nav>

    <!-- Footer Status -->
    <div class="mt-auto border-t border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700/50 dark:bg-gray-800/50">
      <div class="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-1.5">
          <div class="h-2 w-2 rounded-full" :class="connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'" />
          <span>{{ connected ? '已连接' : '未连接' }}</span>
        </div>
        <span>{{ uptime }}</span>
      </div>
      <div class="mt-1 flex items-center justify-between text-center text-xs text-gray-400 font-mono">
        <span>{{ formattedTime }}</span>
        <span class="opacity-50">v1.0.0</span>
      </div>
    </div>
  </aside>

  <!-- Overlay for mobile when sidebar is open -->
  <div
    v-if="showAccountDropdown"
    class="fixed inset-0 z-40 bg-transparent"
    @click="showAccountDropdown = false"
  />

  <AccountModal
    :show="showAccountModal"
    @close="showAccountModal = false"
    @saved="handleAccountSaved"
  />

  <RemarkModal
    :show="showRemarkModal"
    :account="accountToEdit"
    @close="showRemarkModal = false"
    @saved="handleAccountSaved"
  />
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
