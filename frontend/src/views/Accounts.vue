<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AccountModal from '@/components/AccountModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAccountStore } from '@/stores/account'

const router = useRouter()
const accountStore = useAccountStore()
const { accounts, loading } = storeToRefs(accountStore)

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const editingAccount = ref<any>(null)
const accountToDelete = ref<any>(null)
const pollTimer = ref<any>(null)

onMounted(() => {
  accountStore.fetchAccounts()
  pollTimer.value = setInterval(() => {
    accountStore.fetchAccounts()
  }, 3000)
})

onUnmounted(() => {
  if (pollTimer.value)
    clearInterval(pollTimer.value)
})

function openSettings(account: any) {
  accountStore.selectAccount(account.id)
  router.push('/settings')
}

function openAddModal() {
  editingAccount.value = null
  showModal.value = true
}

function openEditModal(account: any) {
  editingAccount.value = { ...account }
  showModal.value = true
}

async function handleDelete(account: any) {
  accountToDelete.value = account
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (accountToDelete.value) {
    try {
      deleteLoading.value = true
      await accountStore.deleteAccount(accountToDelete.value.id)
      accountToDelete.value = null
      showDeleteConfirm.value = false
    }
    finally {
      deleteLoading.value = false
    }
  }
}

async function toggleAccount(account: any) {
  if (account.running) {
    await accountStore.stopAccount(account.id)
  }
  else {
    await accountStore.startAccount(account.id)
  }
}

function handleSaved() {
  accountStore.fetchAccounts()
}
</script>

<template>
  <div class="mx-auto max-w-6xl p-4">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        账号管理
      </h1>
      <BaseButton
        variant="primary"
        @click="openAddModal"
      >
        <div i-carbon-add class="mr-2" />
        添加账号
      </BaseButton>
    </div>

    <div v-if="loading && accounts.length === 0" class="py-8 text-center text-gray-500">
      <div i-svg-spinners-90-ring-with-bg class="mb-2 inline-block text-2xl" />
      <div>加载中...</div>
    </div>

    <div v-else-if="accounts.length === 0" class="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
      <div i-carbon-user-avatar class="mb-4 inline-block text-4xl text-gray-400" />
      <p class="mb-4 text-gray-500">
        暂无账号
      </p>
      <BaseButton
        variant="text"
        @click="openAddModal"
      >
        立即添加
      </BaseButton>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="border border-transparent rounded-lg bg-white p-4 shadow transition-colors hover:border-blue-500 dark:bg-gray-800"
      >
        <div class="mb-4 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 flex items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <img v-if="acc.uin" :src="`https://q1.qlogo.cn/g?b=qq&nk=${acc.uin}&s=100`" class="h-full w-full object-cover">
              <div v-else i-carbon-user class="text-2xl text-gray-400" />
            </div>
            <div>
              <h3 class="text-lg font-bold">
                {{ acc.name || acc.id }}
              </h3>
              <div class="text-sm text-gray-500">
                QQ: {{ acc.uin || '未绑定' }}
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span
              class="rounded-full px-2 py-1 text-xs font-medium"
              :class="acc.running ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
            >
              {{ acc.running ? '运行中' : '已停止' }}
            </span>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
          <BaseButton
            variant="secondary"
            size="sm"
            :class="acc.running ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'"
            @click="toggleAccount(acc)"
          >
            {{ acc.running ? '停止' : '启动' }}
          </BaseButton>

          <div class="flex gap-2">
            <BaseButton
              variant="ghost"
              class="!p-2"
              title="设置"
              @click="openSettings(acc)"
            >
              <div i-carbon-settings />
            </BaseButton>
            <BaseButton
              variant="ghost"
              class="!p-2"
              title="编辑"
              @click="openEditModal(acc)"
            >
              <div i-carbon-edit />
            </BaseButton>
            <BaseButton
              variant="ghost"
              class="!p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              title="删除"
              @click="handleDelete(acc)"
            >
              <div i-carbon-trash-can />
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <AccountModal
      :show="showModal"
      :edit-data="editingAccount"
      @close="showModal = false"
      @saved="handleSaved"
    />

    <ConfirmModal
      :show="showDeleteConfirm"
      :loading="deleteLoading"
      title="删除账号"
      :message="accountToDelete ? `确定要删除账号 ${accountToDelete.name || accountToDelete.id} 吗?` : ''"
      confirm-text="删除"
      type="danger"
      @close="!deleteLoading && (showDeleteConfirm = false)"
      @cancel="!deleteLoading && (showDeleteConfirm = false)"
      @confirm="confirmDelete"
    />
  </div>
</template>
