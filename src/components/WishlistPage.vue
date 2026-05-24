<script setup>
import { computed } from 'vue'

import { useWishlistStore } from '../stores/wishlistStore'
import ProductCard from './ProductCard.vue'

const emit = defineEmits(['view-product'])
const wishlistStore = useWishlistStore()

const wishlistProducts = computed(() => (
  wishlistStore.items.map((product) => ({
    ...product,
    is_wishlisted: true,
  }))
))

function handleWishlistToggle({ product }) {
  wishlistStore.remove(product.id)
}
</script>

<template>
  <main class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
    <section class="min-h-[calc(100vh-81px)] px-6 py-5">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-xl font-semibold text-slate-950">Wishlist</h1>
          <p class="mt-1 text-sm text-slate-500">
            Products you saved for later.
          </p>
        </div>

        <button
          v-if="wishlistStore.count"
          type="button"
          class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="wishlistStore.clear()"
        >
          Clear wishlist
        </button>
      </div>

      <div v-if="wishlistProducts.length" class="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProductCard
          v-for="product in wishlistProducts"
          :key="product.id"
          :product="product"
          @view="emit('view-product', $event)"
          @toggle-wishlist="handleWishlistToggle"
        />
      </div>

      <div v-else class="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <p class="text-sm font-semibold text-slate-700">Your wishlist is empty.</p>
        <p class="mt-1 text-sm text-slate-500">Use the heart button on product cards to save items here.</p>
      </div>
    </section>
  </main>
</template>
