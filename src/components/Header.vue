<script setup>
import NavigationBar from './NavigationBar.vue'
import SearchBar from './SearchBar.vue'

defineProps({
  activeView: {
    type: String,
    default: 'catalog',
  },
})

const emit = defineEmits([
  'show-catalog',
  'show-vendor',
  'show-orders',
  'show-login',
  'show-register',
])
</script>

<template>
  <header class="border-b border-neutral-200 bg-white">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
      <div class="flex items-center justify-between gap-4">
        <button type="button" class="shrink-0" aria-label="Show catalog" @click="emit('show-catalog')">
          <img class="h-10 w-auto" src="../assets/images/logo.png" alt="Vendora">
        </button>
      </div>

      <NavigationBar />

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
            :class="activeView === 'vendor' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-vendor')"
          >
            Vendor
          </button>
          <button
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'orders' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-orders')"
          >
            Orders
          </button>
          <button
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold transition"
            :class="activeView === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="emit('show-login')"
          >
            Login
          </button>
          <button
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
