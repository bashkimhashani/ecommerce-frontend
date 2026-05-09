<script setup>
import { computed, ref } from 'vue'

import VendorProductImageGallery from './VendorProductImageGallery.vue'

const product = ref({
  name: 'MacBook Air 13 M3',
  slug: 'macbook-air-13-m3',
  sku: 'MBA13-M3-256',
  base_price: '1099.00',
})

const images = ref([
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80',
    alt_text: 'MacBook laptop open on desk',
    sort_order: 0,
    is_primary: true,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80',
    alt_text: 'Laptop keyboard and screen',
    sort_order: 1,
    is_primary: false,
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80',
    alt_text: 'Laptop with accessories',
    sort_order: 2,
    is_primary: false,
  },
])

const reorderedPayload = computed(() => ({
  images: images.value.map((image) => ({
    id: image.id,
    sort_order: image.sort_order,
    alt_text: image.alt_text,
    is_primary: image.is_primary,
  })),
}))
</script>

<template>
  <form class="space-y-5">
    <section class="rounded-md border border-slate-200 bg-white">
      <div class="border-b border-slate-200 px-4 py-3">
        <h2 class="text-sm font-semibold text-slate-950">Vendor product form</h2>
      </div>

      <div class="grid gap-4 p-4 md:grid-cols-2">
        <label class="block">
          <span class="text-xs font-medium text-slate-600">Name</span>
          <input
            v-model="product.name"
            type="text"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
        </label>

        <label class="block">
          <span class="text-xs font-medium text-slate-600">Slug</span>
          <input
            v-model="product.slug"
            type="text"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
        </label>

        <label class="block">
          <span class="text-xs font-medium text-slate-600">SKU</span>
          <input
            v-model="product.sku"
            type="text"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
        </label>

        <label class="block">
          <span class="text-xs font-medium text-slate-600">Base price</span>
          <input
            v-model="product.base_price"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
        </label>
      </div>
    </section>

    <VendorProductImageGallery v-model="images" />

    <section class="rounded-md border border-slate-200 bg-slate-950 p-4 text-slate-100">
      <h2 class="text-sm font-semibold">PATCH reorder payload</h2>
      <pre class="mt-3 max-h-64 overflow-auto rounded-md bg-black/30 p-3 text-xs leading-5">{{ JSON.stringify(reorderedPayload, null, 2) }}</pre>
    </section>
  </form>
</template>
