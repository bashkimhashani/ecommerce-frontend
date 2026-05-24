<script setup>
import { computed } from 'vue'
import { usePermission } from '../composables/usePermission'
import { useAuthStore } from '../stores/authStore'
import NavigationBar from './NavigationBar.vue'
import SearchBar from './SearchBar.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  activeView: {
    type: String,
    default: 'catalog',
  },
  selectedCategorySlug: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'select-category',
  'show-catalog',
  'show-vendor',
  'show-orders',
  'show-profile',
  'show-login',
  'show-register',
  'show-tenant-register',
])

const authStore = useAuthStore()
const { can } = usePermission()

const canViewVendor = computed(() => (
  can('read', 'vendor') ||
  can('manage', 'vendor') ||
  can('read', 'inventory')
))
const canViewOrders = computed(() => authStore.role === 'customer' && can('read', 'order'))
const showAuthLinks = computed(() => !authStore.isAuthenticated)
const profileImage = computed(() => (
  authStore.user?.avatar_thumbnail ||
  authStore.user?.avatar ||
  ''
))
const profileInitials = computed(() => {
  const firstInitial = authStore.user?.first_name?.charAt(0) || ''
  const lastInitial = authStore.user?.last_name?.charAt(0) || ''
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'U'
})

</script>

<template>
  <header class="border-b border-neutral-200 bg-white/95 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center">
      <div class="flex items-center justify-between gap-4">
        <button type="button" class="shrink-0" aria-label="Show catalog" @click="emit('show-catalog')">
          <img class="h-10 w-auto mix-blend-multiply dark:mix-blend-screen" src="../assets/images/logo.png" alt="Vendora">
        </button>
      </div>

      <NavigationBar
        :selected-slug="selectedCategorySlug"
        @select-category="emit('select-category', $event)"
      />

      <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
        <SearchBar />
        <div class="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            class="rounded px-4 py-2 text-sm font-semibold transition"
            :class="activeView === 'catalog' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="emit('show-catalog')"
          >
            Catalog
          </button>
          <button
            v-if="canViewVendor"
            type="button"
            class="rounded px-4 py-2 text-sm font-semibold transition"
            :class="activeView === 'vendor' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="emit('show-vendor')"
          >
            Vendor
          </button>
          <button
            v-if="canViewOrders"
            type="button"
            class="rounded px-4 py-2 text-sm font-semibold transition"
            :class="activeView === 'orders' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="emit('show-orders')"
          >
            Orders
          </button>
          <button
            v-if="authStore.isAuthenticated"
            type="button"
            class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition"
            :class="activeView === 'profile' ? 'border-slate-950 bg-slate-950 text-white shadow-sm dark:border-slate-200 dark:bg-slate-200 dark:text-slate-950' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-200 dark:hover:text-white'"
            aria-label="Edit profile"
            title="Edit profile"
            @click="emit('show-profile')"
          >
            <img
              v-if="profileImage"
              class="h-full w-full object-cover"
              :src="profileImage"
              alt=""
            >
            <span v-else>{{ profileInitials }}</span>
          </button>
          <button
            v-if="showAuthLinks"
            type="button"
            class="rounded px-4 py-2 text-sm font-semibold transition"
            :class="activeView === 'tenant-register' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="emit('show-tenant-register')"
          >
            Start selling
          </button>
          <button
            v-if="showAuthLinks"
            type="button"
            class="rounded px-4 py-2 text-sm font-semibold transition"
            :class="activeView === 'login' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="emit('show-login')"
          >
            Login
          </button>
          <button
            v-if="showAuthLinks"
            type="button"
            class="rounded px-4 py-2 text-sm font-semibold transition"
            :class="activeView === 'register' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="emit('show-register')"
          >
            Register
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>
</template>
