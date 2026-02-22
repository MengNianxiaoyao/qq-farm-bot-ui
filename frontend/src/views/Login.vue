<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.post('/api/login', { password: password.value })
    if (res.data.ok) {
      localStorage.setItem('admin_token', res.data.data.token)
      router.push('/')
    }
    else {
      error.value = res.data.error || '登录失败'
    }
  }
  catch (e: any) {
    error.value = e.response?.data?.error || e.message || '登录异常'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div class="max-w-md w-full rounded-xl bg-white p-8 shadow-lg space-y-6 dark:bg-gray-800">
      <div class="text-center">
        <h1 class="text-2xl text-gray-900 font-bold dark:text-white">
          登录面板
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          请输入管理密码
        </p>
      </div>
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="password" class="block text-sm text-gray-700 font-medium dark:text-gray-300">密码</label>
          <div class="relative mt-1">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 sm:text-sm dark:text-white focus:outline-none focus:ring-blue-500"
              placeholder="管理密码"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              @click="showPassword = !showPassword"
            >
              <div v-if="showPassword" i-carbon-view-off />
              <div v-else i-carbon-view />
            </button>
          </div>
        </div>
        <div v-if="error" class="text-sm text-red-600">
          {{ error }}
        </div>
        <button
          type="submit"
          class="w-full flex justify-center border border-transparent rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :disabled="loading"
        >
          <span v-if="loading" i-svg-spinners-90-ring-with-bg class="mr-2" />
          登录
        </button>
      </form>
    </div>
  </div>
</template>
