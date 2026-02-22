import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useStatusStore = defineStore('status', () => {
  const status = ref<any>(null)
  const logs = ref<any[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchStatus(accountId: string) {
    if (!accountId)
      return
    loading.value = true
    try {
      const res = await api.get('/api/status', {
        headers: { 'x-account-id': accountId },
      })
      if (res.data.ok) {
        status.value = res.data.data
      }
      else {
        error.value = res.data.error
      }
    }
    catch (e: any) {
      error.value = e.message
    }
    finally {
      loading.value = false
    }
  }

  async function fetchLogs(accountId: string) {
    if (!accountId)
      return
    try {
      const res = await api.get('/api/logs', {
        headers: { 'x-account-id': accountId },
        params: { limit: 50 },
      })
      if (res.data.ok) {
        logs.value = res.data.data
      }
    }
    catch (e: any) {
      console.error(e)
    }
  }

  return { status, logs, loading, error, fetchStatus, fetchLogs }
})
