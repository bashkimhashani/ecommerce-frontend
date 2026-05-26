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
    class="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-lg shadow-cyan-950/8 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-950/15 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:border-cyan-400/10 dark:bg-slate-900 dark:shadow-black/20 dark:hover:border-cyan-400/40 dark:focus:ring-cyan-300 dark:focus:ring-offset-slate-950"
    role="button"
    tabindex="0"
    :aria-label="`View ${product.name}`"
    @click="viewProduct"
    @keydown.enter.prevent="viewProduct"
    @keydown.space.prevent="viewProduct"
  >
    <div class="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-cyan-50 via-slate-100 to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-cyan-950">
      <div class="absolute left-3 top-3 z-10 rounded-full bg-slate-950/85 px-2.5 py-1 text-xs font-bold text-cyan-100 backdrop-blur dark:bg-cyan-300 dark:text-slate-950">
        Tech pick
      </div>
      <img
        v-if="product.thumbnail"
        :src="product.thumbnail"
        :alt="product.name"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div v-else class="flex h-full items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-emerald-100 px-4 text-center dark:from-slate-800 dark:via-slate-900 dark:to-cyan-950">
        <span class="text-sm font-medium text-slate-500 dark:text-slate-300">
          {{ product.name }}
        </span>
      </div>

      <button
        type="button"
        class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white hover:text-rose-600 dark:border-slate-600 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-rose-300"
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
        <h2 class="min-w-0 text-sm font-black leading-5 text-slate-950 dark:text-slate-50">
          {{ product.name }}
        </h2>
        <span class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
          {{ ratingLabel === 'New' ? ratingLabel : `${ratingLabel} rating` }}
        </span>
      </div>

      <p class="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
        {{ product.slug }}
      </p>

      <p
        v-if="vendorName"
        class="mt-3 truncate rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-200"
        :title="`Added by ${vendorName}`"
      >
        Added by {{ vendorName }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-3 pt-4">
        <p class="text-lg font-black text-emerald-600 dark:text-emerald-300">
          {{ formattedPrice }}
        </p>
        <button
          type="button"
          class="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-600 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          @click.stop="viewProduct"
        >
          View
        </button>
      </div>
    </div>
  </article>
</template>
