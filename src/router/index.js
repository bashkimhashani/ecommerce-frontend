import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const RouteShell = { template: '<span />' }

const routes = [
  {
    path: '/',
    name: 'catalog',
    component: RouteShell,
    meta: { activeView: 'catalog' },
  },
  {
    path: '/products/:productSlug',
    name: 'product-detail',
    component: RouteShell,
    meta: { activeView: 'product-detail' },
  },
  {
    path: '/vendor',
    name: 'vendor',
    component: RouteShell,
    meta: {
      activeView: 'vendor',
      requiresAuth: true,
      roles: ['vendor_admin', 'store_staff', 'superadmin'],
    },
  },
  {
    path: '/orders',
    name: 'orders',
    component: RouteShell,
    meta: {
      activeView: 'orders',
      requiresAuth: true,
      roles: ['customer'],
    },
  },
  {
    path: '/orders/:orderNumber',
    name: 'order-detail',
    component: RouteShell,
    meta: {
      activeView: 'order-detail',
      requiresAuth: true,
      roles: ['customer'],
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: RouteShell,
    meta: {
      activeView: 'profile',
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: RouteShell,
    meta: { activeView: 'login' },
  },
  {
    path: '/register',
    name: 'register',
    component: RouteShell,
    meta: { activeView: 'register' },
  },
  {
    path: '/tenant/register',
    name: 'tenant-register',
    component: RouteShell,
    meta: { activeView: 'tenant-register' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: RouteShell,
    meta: { activeView: 'forgot-password' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: RouteShell,
    meta: { activeView: 'reset-password' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'catalog' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const allowedRoles = to.meta.roles || []
  const requiresAuth = to.meta.requiresAuth || allowedRoles.length > 0

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(authStore.role)) {
    return { name: 'catalog' }
  }

  return true
})

export default router
