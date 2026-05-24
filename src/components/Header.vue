<script setup>
import { computed } from 'vue'
import { usePermission } from '../composables/usePermission'
import { useAuthStore } from '../stores/authStore'
import NavigationBar from './NavigationBar.vue'
import SearchBar from './SearchBar.vue'

defineProps({
  activeView: {
    type: String,
    default: 'catalog',
  },
  selectedCategorySlug: {
    type: String,
    default: '',
  },
  wishlistCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'select-category',
  'show-catalog',
  'show-wishlist',
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
  <header class="border-b border-neutral-200 bg-white">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
      <div class="flex items-center justify-between gap-4">
        <button type="button" class="shrink-0" aria-label="Show catalog" @click="emit('show-catalog')">
          <img class="h-10 w-auto" src="../assets/images/logo.png" alt="Vendora">
        </button>
      </div>

      <NavigationBar
        :selected-slug="selectedCategorySlug"
        @select-category="emit('select-category', $event)"
      />

      <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
        <SearchBar />
        <div class="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'catalog' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-catalog')"
          >
            Catalog
          </button>
          <button
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'wishlist' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-wishlist')"
          >
            Wishlist
            <span
              v-if="wishlistCount"
              class="ml-1 inline-flex min-w-5 justify-center rounded-full bg-rose-100 px-1.5 text-xs font-semibold text-rose-700"
            >
              {{ wishlistCount }}
            </span>
          </button>
          <button
            v-if="canViewVendor"
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'vendor' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-vendor')"
          >
            Vendor
          </button>
          <button
            v-if="canViewOrders"
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'orders' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-orders')"
          >
            Orders
          </button>
          <button
            v-if="authStore.isAuthenticated"
            type="button"
            class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition"
            :class="activeView === 'profile' ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950'"
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
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'tenant-register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-tenant-register')"
          >
            Start selling
          </button>
          <button
            v-if="showAuthLinks"
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-login')"
          >
            Login
          </button>
          <button
            v-if="showAuthLinks"
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-register')"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
