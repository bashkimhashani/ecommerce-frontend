<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['view', 'toggle-wishlist'])
const isWishlisted = ref(Boolean(props.product.is_wishlisted))

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

const vendorName = computed(() => {
  return props.product.vendor?.store_name || props.product.vendor_name || ''
})

function toggleWishlist() {
  isWishlisted.value = !isWishlisted.value
  emit('toggle-wishlist', {
    product: props.product,
    isWishlisted: isWishlisted.value,
  })
}

function viewProduct() {
  emit('view', props.product.slug)
}

watch(() => props.product.is_wishlisted, (nextValue) => {
  isWishlisted.value = Boolean(nextValue)
})
</script>

<template>
  <article
    class="flex h-full cursor-pointer flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-500 dark:focus:ring-slate-200 dark:focus:ring-offset-slate-950"
    role="button"
    tabindex="0"
    :aria-label="`View ${product.name}`"
    @click="viewProduct"
    @keydown.enter.prevent="viewProduct"
    @keydown.space.prevent="viewProduct"
  >
    <div class="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
      <img
        v-if="product.thumbnail"
        :src="product.thumbnail"
        :alt="product.name"
        class="h-full w-full object-cover"
        loading="lazy"
      >
      <div v-else class="flex h-full items-center justify-center bg-slate-100 px-4 text-center dark:bg-slate-800">
        <span class="text-sm font-medium text-slate-500 dark:text-slate-300">
          {{ product.name }}
        </span>
      </div>

      <button
        type="button"
        class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-rose-600 dark:border-slate-600 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-rose-300"
        :class="{ 'text-rose-600': isWishlisted }"
        :aria-pressed="isWishlisted"
        :aria-label="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
        @click.stop="toggleWishlist"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M20.8 4.6c-1.5-1.4-3.9-1.4-5.4.1L12 8.1 8.6 4.7C7.1 3.2 4.7 3.1 3.2 4.6c-1.7 1.6-1.7 4.2-.1 5.9l8.9 8.9 8.9-8.9c1.6-1.7 1.6-4.3-.1-5.9Z"
            :fill="isWishlisted ? 'currentColor' : 'none'"
          />
        </svg>
      </button>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <div class="flex items-start justify-between gap-3">
        <h2 class="min-w-0 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-50">
          {{ product.name }}
        </h2>
        <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {{ ratingLabel === 'New' ? ratingLabel : `${ratingLabel} rating` }}
        </span>
      </div>

      <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
        {{ product.slug }}
      </p>

      <p
        v-if="vendorName"
        class="mt-3 truncate rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-800 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-200"
        :title="`Added by ${vendorName}`"
      >
        Added by {{ vendorName }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-3 pt-4">
        <p class="text-base font-semibold text-slate-950 dark:text-white">
          {{ formattedPrice }}
        </p>
        <button
          type="button"
          class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          @click.stop="viewProduct"
        >
          View
        </button>
      </div>
    </div>
  </article>
</template>
