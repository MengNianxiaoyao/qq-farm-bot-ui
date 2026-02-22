import axios from 'axios'
import { useToastStore } from '@/stores/toast'

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers['x-admin-token'] = token
  }
  const accountId = localStorage.getItem('current_account_id')
  if (accountId) {
    config.headers['x-account-id'] = accountId
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use((response) => {
  return response
}, (error) => {
  const toast = useToastStore()

  if (error.response) {
    if (error.response.status === 401) {
      // Avoid redirect loop or multiple redirects
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('admin_token')
        window.location.href = '/login'
        toast.warning('登录已过期，请重新登录')
      }
    }
    else if (error.response.status >= 500) {
      toast.error(`服务器错误: ${error.response.status} ${error.response.statusText}`)
    }
    else {
      const msg = error.response.data?.message || error.message
      // Don't show toast for 404 if it's expected in some logic?
      // Generally for API calls, 404 is an error.
      toast.error(`请求失败: ${msg}`)
    }
  }
  else if (error.request) {
    toast.error('网络错误，无法连接到服务器')
  }
  else {
    toast.error(`错误: ${error.message}`)
  }

  return Promise.reject(error)
})

export default api
