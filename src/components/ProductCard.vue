<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const formattedPrice = computed(() => {
  const numericPrice = Number(props.product.price)

  if (Number.isNaN(numericPrice)) {
    return props.product.price
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericPrice)
})

const ratingLabel = computed(() => {
  if (props.product.avg_rating === null || props.product.avg_rating === undefined) {
    return 'New'
  }

  return Number(props.product.avg_rating).toFixed(1)
})
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm">
    <div class="aspect-[4/3] bg-slate-100">
      <img
        v-if="product.thumbnail"
        :src="product.thumbnail"
        :alt="product.name"
        class="h-full w-full object-cover"
        loading="lazy"
      >
      <div v-else class="flex h-full items-center justify-center bg-slate-100 px-4 text-center">
        <span class="text-sm font-medium text-slate-400">
          {{ product.name }}
        </span>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <div class="flex items-start justify-between gap-3">
        <h2 class="min-w-0 text-sm font-semibold leading-5 text-slate-950">
          {{ product.name }}
        </h2>
        <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {{ ratingLabel }}
        </span>
      </div>

      <p class="mt-1 truncate text-xs text-slate-500">
        {{ product.slug }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-3 pt-4">
        <p class="text-base font-semibold text-slate-950">
          {{ formattedPrice }}
        </p>
        <button
          type="button"
          class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          View
        </button>
      </div>
    </div>
  </article>
</template>
