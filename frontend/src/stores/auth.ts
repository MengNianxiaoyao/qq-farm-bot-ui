import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const router = useRouter()

  const isAuthenticated = () => !!token.value

  async function login(password: string) {
    try {
      const res = await axios.post('/api/login', { password })
      if (res.data.ok) {
        token.value = res.data.data.token
        localStorage.setItem('admin_token', token.value)
        return true
      }
      return false
    }
    catch (e) {
      console.error(e)
      return false
    }
  }

  function logout() {
    token.value = ''
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  return { token, isAuthenticated, login, logout }
})
