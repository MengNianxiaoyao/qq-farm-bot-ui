<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useAccountStore } from '@/stores/account'
import { useFriendStore } from '@/stores/friend'

const accountStore = useAccountStore()
const friendStore = useFriendStore()
const { currentAccountId } = storeToRefs(accountStore)
const { friends, loading, friendLands, friendLandsLoading } = storeToRefs(friendStore)

// Confirm Modal state
const showConfirm = ref(false)
const confirmMessage = ref('')
const confirmLoading = ref(false)
const pendingAction = ref<(() => Promise<void>) | null>(null)

function confirmAction(msg: string, action: () => Promise<void>) {
  confirmMessage.value = msg
  pendingAction.value = action
  showConfirm.value = true
}

async function onConfirm() {
  if (pendingAction.value) {
    try {
      confirmLoading.value = true
      await pendingAction.value()
      pendingAction.value = null
      showConfirm.value = false
    }
    finally {
      confirmLoading.value = false
    }
  }
  else {
    showConfirm.value = false
  }
}

// Track expanded friends
const expandedFriends = ref<Set<string>>(new Set())

function loadFriends() {
  if (currentAccountId.value)
    friendStore.fetchFriends(currentAccountId.value)
}

function formatTime(sec: number) {
  if (sec <= 0)
    return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

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

useIntervalFn(() => {
  for (const gid in friendLands.value) {
    if (friendLands.value[gid]) {
      friendLands.value[gid].forEach((l: any) => {
        if (l.matureInSec > 0)
          l.matureInSec--
      })
    }
  }
}, 1000)

onMounted(() => {
  loadFriends()
})

watch(currentAccountId, () => {
  expandedFriends.value.clear()
  loadFriends()
})

function toggleFriend(friendId: string) {
  if (expandedFriends.value.has(friendId)) {
    expandedFriends.value.delete(friendId)
  }
  else {
    // Collapse others? The original code does:
    // document.querySelectorAll('.friend-lands').forEach(e => e.style.display = 'none');
    // So it behaves like an accordion.
    expandedFriends.value.clear()
    expandedFriends.value.add(friendId)
    if (currentAccountId.value) {
      friendStore.fetchFriendLands(currentAccountId.value, friendId)
    }
  }
}

async function handleOp(friendId: string, type: string, e: Event) {
  e.stopPropagation() // Prevent toggling
  if (!currentAccountId.value)
    return

  confirmAction('确定执行此操作吗?', async () => {
    await friendStore.operate(currentAccountId.value!, friendId, type)
  })
}

function getFriendStatusText(friend: any) {
  const p = friend.plant || {}
  const info = []
  if (p.stealNum)
    info.push(`偷${p.stealNum}`)
  if (p.dryNum)
    info.push(`水${p.dryNum}`)
  if (p.weedNum)
    info.push(`草${p.weedNum}`)
  if (p.insectNum)
    info.push(`虫${p.insectNum}`)
  return info.length ? info.join(' ') : '无操作'
}
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <div class="i-carbon-user-multiple" />
        好友
      </h2>
      <div v-if="friends.length" class="text-sm text-gray-500">
        共 {{ friends.length }} 名好友
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="i-svg-spinners-90-ring-with-bg text-4xl text-blue-500" />
    </div>

    <div v-else-if="!currentAccountId" class="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">
      请选择账号后查看好友
    </div>

    <div v-else-if="friends.length === 0" class="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">
      暂无好友或数据加载失败
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="friend in friends"
        :key="friend.gid"
        class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800"
      >
        <div
          class="flex flex-col cursor-pointer justify-between gap-4 p-4 transition sm:flex-row sm:items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          @click="toggleFriend(friend.gid)"
        >
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-1 ring-gray-100 dark:bg-gray-600 dark:ring-gray-700">
              <img
                v-if="friend.uin || friend.gid"
                :src="`http://q1.qlogo.cn/g?b=qq&nk=${friend.uin || friend.gid}&s=100`"
                class="h-full w-full object-cover"
                loading="lazy"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              >
              <div v-else class="i-carbon-user text-gray-400" />
            </div>
            <div>
              <div class="font-bold">
                {{ friend.name }}
              </div>
              <div class="text-sm" :class="getFriendStatusText(friend) !== '无操作' ? 'text-green-500 font-medium' : 'text-gray-400'">
                {{ getFriendStatusText(friend) }}
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 transition hover:bg-blue-200"
              @click="handleOp(friend.gid, 'steal', $event)"
            >
              偷取
            </button>
            <button
              class="rounded bg-cyan-100 px-3 py-1 text-sm text-cyan-700 transition hover:bg-cyan-200"
              @click="handleOp(friend.gid, 'water', $event)"
            >
              浇水
            </button>
            <button
              class="rounded bg-green-100 px-3 py-1 text-sm text-green-700 transition hover:bg-green-200"
              @click="handleOp(friend.gid, 'weed', $event)"
            >
              除草
            </button>
            <button
              class="rounded bg-orange-100 px-3 py-1 text-sm text-orange-700 transition hover:bg-orange-200"
              @click="handleOp(friend.gid, 'bug', $event)"
            >
              除虫
            </button>
            <button
              class="rounded bg-red-100 px-3 py-1 text-sm text-red-700 transition hover:bg-red-200"
              @click="handleOp(friend.gid, 'bad', $event)"
            >
              捣乱
            </button>
          </div>
        </div>

        <div v-if="expandedFriends.has(friend.gid)" class="border-t bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
          <div v-if="friendLandsLoading[friend.gid]" class="flex justify-center py-4">
            <div class="i-svg-spinners-90-ring-with-bg text-2xl text-blue-500" />
          </div>
          <div v-else-if="!friendLands[friend.gid] || friendLands[friend.gid]?.length === 0" class="py-4 text-center text-gray-500">
            无土地数据
          </div>
          <div v-else class="grid grid-cols-3 gap-2 lg:grid-cols-8 md:grid-cols-5 sm:grid-cols-4">
            <div
              v-for="land in friendLands[friend.gid]"
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

              <div class="mt-auto flex origin-bottom scale-90 gap-0.5 text-[10px]">
                <span v-if="land.needWater" class="rounded bg-blue-100 px-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">水</span>
                <span v-if="land.needWeed" class="rounded bg-green-100 px-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">草</span>
                <span v-if="land.needBug" class="rounded bg-red-100 px-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-400">虫</span>
                <span v-if="land.status === 'harvestable'" class="rounded bg-orange-100 px-0.5 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">可偷</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ConfirmModal
    :show="showConfirm"
    :loading="confirmLoading"
    title="确认操作"
    :message="confirmMessage"
    @confirm="onConfirm"
    @cancel="!confirmLoading && (showConfirm = false)"
  />
</template>
