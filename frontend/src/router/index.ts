import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
        },
        {
          path: 'farm',
          name: 'farm',
          component: () => import('@/views/Farm.vue'),
        },
        {
          path: 'bag',
          name: 'bag',
          component: () => import('@/views/Bag.vue'),
        },
        {
          path: '/friends',
          name: 'friends',
          component: () => import('@/views/Friends.vue'),
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: () => import('@/views/Accounts.vue'),
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/views/Analytics.vue'),
        },
        {
          path: '/settings',
          name: 'Settings',
          component: () => import('@/views/Settings.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.name !== 'login' && !token)
    next({ name: 'login' })
  else next()
})

export default router
