import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

export const PERMISSION_RULES = {
  guest: {
    catalog: ['read'],
    product: ['read'],
  },
  customer: {
    catalog: ['read'],
    product: ['read'],
    cart: ['read', 'create', 'update', 'delete'],
    checkout: ['create'],
    order: ['read', 'create', 'cancel'],
    profile: ['read', 'update'],
  },
  store_staff: {
    catalog: ['read'],
    inventory: ['read', 'update'],
    product: ['read'],
  },
  vendor_admin: {
    catalog: ['read', 'create', 'update', 'delete', 'manage'],
    inventory: ['read', 'create', 'update', 'delete', 'manage'],
    order: ['read', 'update', 'manage'],
    product: ['read', 'create', 'update', 'delete', 'manage'],
    vendor: ['read', 'update', 'manage'],
  },
  superadmin: {
    '*': ['*'],
  },
}

function normalizePermissionValue(value) {
  return String(value || '').trim().toLowerCase()
}

export function hasPermission(role, action, resource) {
  const normalizedRole = normalizePermissionValue(role) || 'guest'
  const normalizedAction = normalizePermissionValue(action)
  const normalizedResource = normalizePermissionValue(resource)
  const permissions = PERMISSION_RULES[normalizedRole] || PERMISSION_RULES.guest
  const allowedActions = permissions[normalizedResource] || permissions['*'] || []

  return allowedActions.includes('*') || allowedActions.includes(normalizedAction)
}

export function usePermission() {
  const authStore = useAuthStore()
  const role = computed(() => authStore.role || 'guest')

  function can(action, resource) {
    return hasPermission(role.value, action, resource)
  }

  return {
    can,
    role,
  }
}
