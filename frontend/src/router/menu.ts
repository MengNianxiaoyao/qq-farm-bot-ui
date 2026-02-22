export interface MenuItem {
  path: string
  name: string
  label: string
  icon: string
  component: () => Promise<any>
}

export const menuRoutes: MenuItem[] = [
  {
    path: '',
    name: 'dashboard',
    label: '概览',
    icon: 'i-carbon-chart-pie',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: 'farm',
    name: 'farm',
    label: '农场',
    icon: 'i-carbon-sprout',
    component: () => import('@/views/Farm.vue'),
  },
  {
    path: 'bag',
    name: 'bag',
    label: '背包',
    icon: 'i-carbon-box',
    component: () => import('@/views/Bag.vue'),
  },
  {
    path: 'friends',
    name: 'friends',
    label: '好友',
    icon: 'i-carbon-user-multiple',
    component: () => import('@/views/Friends.vue'),
  },
  {
    path: 'analytics',
    name: 'analytics',
    label: '分析',
    icon: 'i-carbon-analytics',
    component: () => import('@/views/Analytics.vue'),
  },
  {
    path: 'accounts',
    name: 'accounts',
    label: '账号',
    icon: 'i-carbon-user-settings',
    component: () => import('@/views/Accounts.vue'),
  },
  {
    path: 'settings',
    name: 'Settings',
    label: '设置',
    icon: 'i-carbon-settings',
    component: () => import('@/views/Settings.vue'),
  },
]
