<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useAccountStore } from '@/stores/account'
import { useFarmStore } from '@/stores/farm'
import { useSettingStore } from '@/stores/setting'

const settingStore = useSettingStore()
const accountStore = useAccountStore()
const farmStore = useFarmStore()

const { settings, loading } = storeToRefs(settingStore)
const { currentAccountId, accounts } = storeToRefs(accountStore)
const { seeds } = storeToRefs(farmStore)

const saving = ref(false)
const passwordSaving = ref(false)
const offlineSaving = ref(false)

const modalVisible = ref(false)
const modalConfig = ref({
  title: '',
  message: '',
  type: 'primary' as 'primary' | 'danger',
  isAlert: true,
})

function showAlert(message: string, type: 'primary' | 'danger' = 'primary') {
  modalConfig.value = {
    title: type === 'danger' ? '错误' : '提示',
    message,
    type,
    isAlert: true,
  }
  modalVisible.value = true
}

const currentAccountName = computed(() => {
  const acc = accounts.value.find((a: any) => a.id === currentAccountId.value)
  return acc ? (acc.name || acc.id) : currentAccountId.value
})

const localSettings = ref({
  plantingStrategy: 'preferred',
  preferredSeedId: 0,
  intervals: { farmMin: 2, farmMax: 2, friendMin: 10, friendMax: 10 },
  friendQuietHours: { enabled: false, start: '23:00', end: '07:00' },
  automation: {
    farm: false,
    task: false,
    sell: false,
    friend: false,
    farm_push: false,
    land_upgrade: false,
    friend_steal: false,
    friend_help: false,
    friend_bad: false,
    fertilizer: 'none',
  },
})

const localOffline = ref({
  channel: 'webhook',
  reloginUrlMode: 'none',
  endpoint: '',
  token: '',
  title: '',
  msg: '',
  offlineDeleteSec: 120,
})

const passwordForm = ref({
  old: '',
  new: '',
  confirm: '',
})

function syncLocalSettings() {
  if (settings.value) {
    localSettings.value = JSON.parse(JSON.stringify({
      plantingStrategy: settings.value.plantingStrategy,
      preferredSeedId: settings.value.preferredSeedId,
      intervals: settings.value.intervals,
      friendQuietHours: settings.value.friendQuietHours,
      automation: settings.value.automation,
    }))

    // Default automation values if missing
    if (!localSettings.value.automation) {
      localSettings.value.automation = {
        farm: false,
        task: false,
        sell: false,
        friend: false,
        farm_push: false,
        land_upgrade: false,
        friend_steal: false,
        friend_help: false,
        friend_bad: false,
        fertilizer: 'none',
      }
    }

    // Sync offline settings (global)
    if (settings.value.offlineReminder) {
      localOffline.value = JSON.parse(JSON.stringify(settings.value.offlineReminder))
    }
  }
}

async function loadData() {
  if (currentAccountId.value) {
    await settingStore.fetchSettings(currentAccountId.value)
    syncLocalSettings()
    // Always fetch seeds to ensure correct locked status for current account
    await farmStore.fetchSeeds(currentAccountId.value)
  }
}

onMounted(() => {
  loadData()
})

watch(currentAccountId, () => {
  loadData()
})

async function saveAccountSettings() {
  if (!currentAccountId.value)
    return
  saving.value = true
  const res = await settingStore.saveSettings(currentAccountId.value, localSettings.value)
  saving.value = false
  if (res.ok) {
    showAlert('账号设置已保存')
  }
  else {
    showAlert(`保存失败: ${res.error}`, 'danger')
  }
}

async function handleChangePassword() {
  if (!passwordForm.value.old || !passwordForm.value.new) {
    showAlert('请填写完整', 'danger')
    return
  }
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    showAlert('两次密码输入不一致', 'danger')
    return
  }
  if (passwordForm.value.new.length < 4) {
    showAlert('密码长度至少4位', 'danger')
    return
  }

  passwordSaving.value = true
  const res = await settingStore.changeAdminPassword(passwordForm.value.old, passwordForm.value.new)
  passwordSaving.value = false

  if (res.ok) {
    showAlert('密码修改成功')
    passwordForm.value = { old: '', new: '', confirm: '' }
  }
  else {
    showAlert(`修改失败: ${res.error || '未知错误'}`, 'danger')
  }
}

async function handleSaveOffline() {
  offlineSaving.value = true
  const res = await settingStore.saveOfflineConfig(localOffline.value)
  offlineSaving.value = false

  if (res.ok) {
    showAlert('下线提醒设置已保存')
  }
  else {
    showAlert(`保存失败: ${res.error || '未知错误'}`, 'danger')
  }
}
</script>

<template>
  <div class="settings-page">
    <div v-if="loading" class="py-4 text-center text-gray-500">
      <div class="i-svg-spinners-ring-resize mx-auto mb-2 text-2xl" />
      <p>加载中...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Account Settings -->
      <div v-if="currentAccountId" class="card rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold">
          <div i-carbon-settings-adjust />
          账号策略设置 ({{ currentAccountName }})
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Strategy -->
          <div class="space-y-4">
            <h3 class="border-b pb-2 text-gray-700 font-semibold dark:text-gray-300">
              种植策略
            </h3>

            <div>
              <label class="mb-1 block text-sm font-medium">策略模式</label>
              <select
                v-model="localSettings.plantingStrategy"
                class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="preferred">
                  优先种植种子 (下方选择)
                </option>
                <option value="level">
                  最高等级作物
                </option>
                <option value="max_exp">
                  最大经验/时
                </option>
                <option value="max_fert_exp">
                  最大普通肥经验/时
                </option>
                <option value="max_profit">
                  最大净利润/时
                </option>
                <option value="max_fert_profit">
                  最大普通肥净利润/时
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">优先种子</label>
              <select
                v-model="localSettings.preferredSeedId"
                class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                :disabled="localSettings.plantingStrategy !== 'preferred'"
              >
                <option :value="0">
                  自动选择
                </option>
                <option
                  v-for="seed in seeds"
                  :key="seed.seedId"
                  :value="seed.seedId"
                  :disabled="seed.locked || seed.soldOut"
                >
                  {{ seed.requiredLevel }}级 {{ seed.name }} ({{ seed.price }}金)
                </option>
              </select>
            </div>
          </div>

          <!-- Intervals -->
          <div class="space-y-4">
            <h3 class="border-b pb-2 text-gray-700 font-semibold dark:text-gray-300">
              时间间隔 (秒)
            </h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm font-medium">农场巡查最小</label>
                <input
                  v-model.number="localSettings.intervals.farmMin"
                  type="number"
                  min="1"
                  class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium">农场巡查最大</label>
                <input
                  v-model.number="localSettings.intervals.farmMax"
                  type="number"
                  min="1"
                  class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium">好友巡查最小</label>
                <input
                  v-model.number="localSettings.intervals.friendMin"
                  type="number"
                  min="1"
                  class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium">好友巡查最大</label>
                <input
                  v-model.number="localSettings.intervals.friendMax"
                  type="number"
                  min="1"
                  class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <h3 class="border-b pb-2 text-gray-700 font-semibold dark:text-gray-300">
            好友静默时段
          </h3>
          <div class="flex flex-wrap items-center gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="localSettings.friendQuietHours.enabled"
                type="checkbox"
                class="h-4 w-4 rounded text-blue-600"
              >
              <span>启用</span>
            </label>
            <div class="flex items-center gap-2">
              <span>开始:</span>
              <input
                v-model="localSettings.friendQuietHours.start"
                type="time"
                class="border rounded px-2 py-1 dark:border-gray-600 dark:bg-gray-700"
                :disabled="!localSettings.friendQuietHours.enabled"
              >
            </div>
            <div class="flex items-center gap-2">
              <span>结束:</span>
              <input
                v-model="localSettings.friendQuietHours.end"
                type="time"
                class="border rounded px-2 py-1 dark:border-gray-600 dark:bg-gray-700"
                :disabled="!localSettings.friendQuietHours.enabled"
              >
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <h3 class="border-b pb-2 text-gray-700 font-semibold dark:text-gray-300">
            自动化开关
          </h3>

          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 md:grid-cols-3">
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.farm" type="checkbox" class="h-4 w-4">
              <span>自动种植/收获</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.task" type="checkbox" class="h-4 w-4">
              <span>自动做任务</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.sell" type="checkbox" class="h-4 w-4">
              <span>自动卖果实</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.friend" type="checkbox" class="h-4 w-4">
              <span>自动好友互动</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.farm_push" type="checkbox" class="h-4 w-4">
              <span>推送触发巡田</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.land_upgrade" type="checkbox" class="h-4 w-4">
              <span>自动升级土地</span>
            </label>
          </div>

          <div v-if="localSettings.automation.friend" class="grid grid-cols-2 mt-2 gap-4 border-l-2 border-blue-200 pl-4 md:grid-cols-4 dark:border-blue-900">
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.friend_steal" type="checkbox" class="h-4 w-4">
              <span>自动偷菜</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.friend_help" type="checkbox" class="h-4 w-4">
              <span>自动帮忙</span>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input v-model="localSettings.automation.friend_bad" type="checkbox" class="h-4 w-4">
              <span>自动捣乱</span>
            </label>
          </div>

          <div class="mt-4">
            <label class="mb-1 block text-sm font-medium">施肥策略</label>
            <select
              v-model="localSettings.automation.fertilizer"
              class="w-full border rounded px-3 py-2 md:w-1/2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="both">
                普通 + 有机
              </option>
              <option value="normal">
                仅普通化肥
              </option>
              <option value="organic">
                仅有机化肥
              </option>
              <option value="none">
                不施肥
              </option>
            </select>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button
            class="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            :disabled="saving"
            @click="saveAccountSettings"
          >
            <div v-if="saving" class="i-svg-spinners-ring-resize" />
            <span>保存账号设置</span>
          </button>
        </div>
      </div>

      <div v-else class="card rounded bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
        请先在顶部选择一个账号以配置策略和自动化选项。
      </div>

      <!-- System Settings -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Password -->
        <div class="card rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold">
            <div i-carbon-password />
            管理密码
          </h2>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium">当前密码</label>
              <input v-model="passwordForm.old" type="password" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium">新密码 (至少4位)</label>
              <input v-model="passwordForm.new" type="password" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium">确认新密码</label>
              <input v-model="passwordForm.confirm" type="password" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
            </div>
            <div class="pt-2">
              <button
                class="w-full rounded bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                :disabled="passwordSaving"
                @click="handleChangePassword"
              >
                <span v-if="passwordSaving">修改中...</span>
                <span v-else>修改密码</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Offline Reminder -->
        <div class="card rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold">
            <div i-carbon-notification />
            下线提醒
          </h2>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium">推送渠道</label>
              <select v-model="localOffline.channel" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <option value="webhook">
                  webhook (自定义接口)
                </option>
                <option value="qmsg">
                  qmsg
                </option>
                <option value="serverchan">
                  serverchan
                </option>
                <option value="pushplus">
                  pushplus
                </option>
                <option value="dingtalk">
                  dingtalk
                </option>
                <option value="wecom">
                  wecom
                </option>
                <option value="bark">
                  bark
                </option>
                <option value="telegram">
                  telegram
                </option>
                <!-- Add more as needed -->
              </select>
            </div>

            <div v-if="localOffline.channel === 'webhook'">
              <label class="mb-1 block text-sm font-medium">接口地址</label>
              <input v-model="localOffline.endpoint" type="text" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Token</label>
              <input v-model="localOffline.token" type="text" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700" placeholder="接收端 token">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm font-medium">标题</label>
                <input v-model="localOffline.title" type="text" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium">重登录链接</label>
                <select v-model="localOffline.reloginUrlMode" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                  <option value="none">
                    不需要
                  </option>
                  <option value="qq_link">
                    QQ直链
                  </option>
                  <option value="qr_link">
                    二维码链接
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">离线删除账号 (秒)</label>
              <input v-model.number="localOffline.offlineDeleteSec" type="number" min="1" class="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
            </div>

            <div class="pt-2">
              <button
                class="w-full rounded bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                :disabled="offlineSaving"
                @click="handleSaveOffline"
              >
                <span v-if="offlineSaving">保存中...</span>
                <span v-else>保存提醒设置</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :show="modalVisible"
      :title="modalConfig.title"
      :message="modalConfig.message"
      :type="modalConfig.type"
      :is-alert="modalConfig.isAlert"
      confirm-text="知道了"
      @confirm="modalVisible = false"
      @cancel="modalVisible = false"
    />
  </div>
</template>

<style scoped lang="postcss">
/* Custom switch style if needed, or use daisyUI/headlessUI/custom CSS */
input[type='checkbox'] {
  @apply rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
}
</style>
