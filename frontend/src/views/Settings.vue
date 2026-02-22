<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
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

const fertilizerOptions = [
  { label: '普通 + 有机', value: 'both' },
  { label: '仅普通化肥', value: 'normal' },
  { label: '仅有机化肥', value: 'organic' },
  { label: '不施肥', value: 'none' },
]

const plantingStrategyOptions = [
  { label: '优先种植种子 (下方选择)', value: 'preferred' },
  { label: '最高等级作物', value: 'level' },
  { label: '最大经验/时', value: 'max_exp' },
  { label: '最大普通肥经验/时', value: 'max_fert_exp' },
  { label: '最大净利润/时', value: 'max_profit' },
  { label: '最大普通肥净利润/时', value: 'max_fert_profit' },
]

const channelOptions = [
  { label: 'webhook (自定义接口)', value: 'webhook' },
  { label: 'qmsg', value: 'qmsg' },
  { label: 'serverchan', value: 'serverchan' },
  { label: 'pushplus', value: 'pushplus' },
  { label: 'dingtalk', value: 'dingtalk' },
  { label: 'wecom', value: 'wecom' },
  { label: 'bark', value: 'bark' },
  { label: 'telegram', value: 'telegram' },
]

const reloginUrlModeOptions = [
  { label: '不需要', value: 'none' },
  { label: 'QQ直链', value: 'qq_link' },
  { label: '二维码链接', value: 'qr_link' },
]

const preferredSeedOptions = computed(() => {
  const options = [{ label: '自动选择', value: 0 }]
  if (seeds.value) {
    options.push(...seeds.value.map(seed => ({
      label: `${seed.requiredLevel}级 ${seed.name} (${seed.price}金)`,
      value: seed.seedId,
      disabled: seed.locked || seed.soldOut,
    })))
  }
  return options
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

    <div v-else class="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2 text-sm">
      <!-- Card 1: Strategy & Automation -->
      <div v-if="currentAccountId" class="card flex flex-col h-full rounded-lg bg-white shadow dark:bg-gray-800">
        <!-- Strategy Header -->
        <div class="border-b px-4 py-3 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 class="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <div class="i-fas-cogs" />
            策略设置
            <span v-if="currentAccountName" class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({{ currentAccountName }})
            </span>
          </h3>
        </div>

        <!-- Strategy Content -->
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BaseSelect
              v-model="localSettings.plantingStrategy"
              label="种植策略"
              :options="plantingStrategyOptions"
            />
            <BaseSelect
              v-model="localSettings.preferredSeedId"
              label="优先种植种子"
              :disabled="localSettings.plantingStrategy !== 'preferred'"
              :options="preferredSeedOptions"
            />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <BaseInput
              v-model.number="localSettings.intervals.farmMin"
              label="农场巡查最小 (秒)"
              type="number"
              min="1"
            />
            <BaseInput
              v-model.number="localSettings.intervals.farmMax"
              label="农场巡查最大 (秒)"
              type="number"
              min="1"
            />
            <BaseInput
              v-model.number="localSettings.intervals.friendMin"
              label="好友巡查最小 (秒)"
              type="number"
              min="1"
            />
            <BaseInput
              v-model.number="localSettings.intervals.friendMax"
              label="好友巡查最大 (秒)"
              type="number"
              min="1"
            />
          </div>

          <div class="flex flex-wrap items-center gap-4 pt-1 border-t dark:border-gray-700">
            <BaseSwitch
              v-model="localSettings.friendQuietHours.enabled"
              label="启用静默时段"
            />
            <div class="flex items-center gap-2">
              <BaseInput
                v-model="localSettings.friendQuietHours.start"
                type="time"
                class="w-24"
                :disabled="!localSettings.friendQuietHours.enabled"
              />
              <span class="text-gray-500">-</span>
              <BaseInput
                v-model="localSettings.friendQuietHours.end"
                type="time"
                class="w-24"
                :disabled="!localSettings.friendQuietHours.enabled"
              />
            </div>
          </div>
        </div>

        <!-- Auto Control Header -->
        <div class="border-t border-b px-4 py-3 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 class="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <div class="i-fas-toggle-on" />
            自动控制
          </h3>
        </div>

        <!-- Auto Control Content -->
        <div class="p-4 space-y-4 flex-1">
          <!-- Switches Grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <BaseSwitch v-model="localSettings.automation.farm" label="自动种植收获" />
            <BaseSwitch v-model="localSettings.automation.task" label="自动做任务" />
            <BaseSwitch v-model="localSettings.automation.sell" label="自动卖果实" />
            <BaseSwitch v-model="localSettings.automation.friend" label="自动好友互动" />
            <BaseSwitch v-model="localSettings.automation.farm_push" label="推送触发巡田" />
            <BaseSwitch v-model="localSettings.automation.land_upgrade" label="自动升级土地" />
          </div>

          <!-- Sub-controls -->
          <div v-if="localSettings.automation.friend" class="flex flex-wrap gap-4 rounded bg-blue-50 p-2 dark:bg-blue-900/20 text-sm">
            <BaseSwitch v-model="localSettings.automation.friend_steal" label="自动偷菜" />
            <BaseSwitch v-model="localSettings.automation.friend_help" label="自动帮忙" />
            <BaseSwitch v-model="localSettings.automation.friend_bad" label="自动捣乱" />
          </div>

          <!-- Fertilizer -->
          <div>
            <BaseSelect
              v-model="localSettings.automation.fertilizer"
              label="施肥策略"
              class="w-full md:w-1/2"
              :options="fertilizerOptions"
            />
          </div>
        </div>

        <!-- Save Button -->
        <div class="border-t px-4 py-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end mt-auto">
          <BaseButton
            variant="primary"
            size="sm"
            :loading="saving"
            @click="saveAccountSettings"
          >
            保存策略与自动控制
          </BaseButton>
        </div>
      </div>

      <div v-else class="card rounded bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
        请先在登录一个账号以配置策略和自动化选项。
      </div>

      <!-- Card 2: System Settings (Password & Offline) -->
      <div class="card flex flex-col h-full rounded-lg bg-white shadow dark:bg-gray-800">
        <!-- Password Header -->
        <div class="border-b px-4 py-3 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 class="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <div class="i-carbon-password" />
            管理密码
          </h3>
        </div>

        <!-- Password Content -->
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BaseInput
              v-model="passwordForm.old"
              label="当前密码"
              type="password"
              placeholder="当前管理密码"
            />
            <BaseInput
              v-model="passwordForm.new"
              label="新密码"
              type="password"
              placeholder="至少 4 位"
            />
            <BaseInput
              v-model="passwordForm.confirm"
              label="确认新密码"
              type="password"
              placeholder="再次输入新密码"
            />
          </div>
          
          <div class="flex items-center justify-between pt-1">
            <p class="text-xs text-gray-500">建议修改默认密码 (admin)</p>
            <BaseButton
              variant="primary"
              size="sm"
              :loading="passwordSaving"
              @click="handleChangePassword"
            >
              修改管理密码
            </BaseButton>
          </div>
        </div>

        <!-- Offline Header -->
        <div class="border-t border-b px-4 py-3 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 class="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <div class="i-carbon-notification" />
            下线提醒
          </h3>
        </div>

        <!-- Offline Content -->
        <div class="p-4 space-y-3 flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BaseSelect
              v-model="localOffline.channel"
              label="推送渠道"
              :options="channelOptions"
            />
            <BaseSelect
              v-model="localOffline.reloginUrlMode"
              label="重登录链接"
              :options="reloginUrlModeOptions"
            />
          </div>

          <BaseInput
            v-if="localOffline.channel === 'webhook'"
            v-model="localOffline.endpoint"
            label="接口地址"
            type="text"
          />

          <BaseInput
            v-model="localOffline.token"
            label="Token"
            type="text"
            placeholder="接收端 token"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BaseInput
              v-model="localOffline.title"
              label="标题"
              type="text"
              placeholder="提醒标题"
            />
            <BaseInput
              v-model.number="localOffline.offlineDeleteSec"
              label="离线删除账号 (秒)"
              type="number"
              min="1"
              placeholder="默认 120"
            />
          </div>
          
          <BaseInput
            v-model="localOffline.msg"
            label="内容"
            type="text"
            placeholder="提醒内容"
          />
        </div>

        <!-- Save Offline Button -->
        <div class="border-t px-4 py-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end mt-auto">
          <BaseButton
            variant="primary"
            size="sm"
            :loading="offlineSaving"
            @click="handleSaveOffline"
          >
            保存下线提醒设置
          </BaseButton>
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
/* Custom styles if needed */
</style>
