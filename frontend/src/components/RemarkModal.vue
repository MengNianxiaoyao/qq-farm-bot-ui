<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/api'

const props = defineProps<{
  show: boolean
  account?: any
}>()

const emit = defineEmits(['close', 'saved'])

const name = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.show, (val) => {
  errorMessage.value = ''
  if (val && props.account) {
    name.value = props.account.name || ''
  }
})

async function save() {
  if (!props.account)
    return
  loading.value = true
  errorMessage.value = ''
  try {
    // 使用 name 字段存储备注
    const payload = {
      ...props.account,
      name: name.value,
    }
    // 确保不发送 nick
    delete payload.nick

    const res = await api.post('/api/accounts', payload)
    if (res.data.ok) {
      emit('saved')
      emit('close')
    }
    else {
      errorMessage.value = `保存失败: ${res.data.error}`
    }
  }
  catch (e: any) {
    errorMessage.value = `保存失败: ${e.response?.data?.error || e.message}`
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="max-w-sm w-full overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold">
          修改备注
        </h3>
        <button class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" @click="$emit('close')">
          <div class="i-carbon-close text-xl" />
        </button>
      </div>

      <div class="p-4 space-y-4">
        <div v-if="errorMessage" class="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {{ errorMessage }}
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-700 font-medium dark:text-gray-300">备注名称</label>
          <input
            v-model="name"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="请输入备注名称"
            @keyup.enter="save"
          >
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="border border-gray-300 rounded px-4 py-2 text-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            class="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="loading"
            @click="save"
          >
            <div v-if="loading" class="i-svg-spinners-90-ring-with-bg" />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
