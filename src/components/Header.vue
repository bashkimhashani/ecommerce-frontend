<script setup>
import NavigationBar from './NavigationBar.vue'
import Searchbar from './Searchbar.vue'

defineProps({
  activeView: {
    type: String,
    default: 'store',
  },
})

const emit = defineEmits(['show-store', 'show-orders'])
</script>

<template>
  <header class="border-b border-neutral-200 bg-white">
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
      <div class="flex items-center justify-between gap-4">
        <button type="button" class="shrink-0" aria-label="Show store" @click="emit('show-store')">
          <img class="h-10 w-auto" src="../assets/images/logo.png" alt="Vendora">
        </button>
      </div>

      <NavigationBar />

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Searchbar />
        <button
          class="h-10 rounded-md border px-4 text-sm font-semibold transition"
          :class="activeView === 'orders' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'"
          type="button"
          @click="emit('show-orders')"
        >
          Orders
        </button>
      </div>
    </div>
  </header>
</template>
