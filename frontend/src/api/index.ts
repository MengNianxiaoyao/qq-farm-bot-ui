import axios from 'axios'

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
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/login'
  }
  return Promise.reject(error)
})

export default api
