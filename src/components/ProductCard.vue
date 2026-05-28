<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["view", "toggle-wishlist"]);
const isWishlisted = ref(Boolean(props.product.is_wishlisted));

const formattedPrice = computed(() => {
  const numericPrice = Number(props.product.price);

  if (Number.isNaN(numericPrice)) {
    return props.product.price;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericPrice);
});

const vendorName = computed(() => {
  return props.product.vendor?.store_name || props.product.vendor_name || "";
});

function toggleWishlist() {
  isWishlisted.value = !isWishlisted.value;
  emit("toggle-wishlist", {
    product: props.product,
    isWishlisted: isWishlisted.value,
  });
}

function viewProduct() {
  emit("view", props.product.slug);
}

watch(
  () => props.product.is_wishlisted,
  (nextValue) => {
    isWishlisted.value = Boolean(nextValue);
  }
);
</script>

<template>
  <article
    class="group grid h-full min-h-0 cursor-pointer grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 dark:hover:border-cyan-400/40 dark:focus:ring-cyan-300 dark:focus:ring-offset-slate-950"
    role="button"
    tabindex="0"
    :aria-label="`View ${product.name}`"
    @click="viewProduct"
    @keydown.enter.prevent="viewProduct"
    @keydown.space.prevent="viewProduct"
  >
    <div
      class="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-slate-50 p-3 dark:bg-slate-800"
    >
      <img
        v-if="product.thumbnail"
        :src="product.thumbnail"
        :alt="product.name"
        class="max-h-[88%] max-w-[92%] object-contain transition duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full items-center justify-center bg-slate-100 px-4 text-center dark:bg-slate-800"
      >
        <span class="text-sm font-medium text-slate-500 dark:text-slate-300">
          {{ product.name }}
        </span>
      </div>

      <button
        type="button"
        class="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white hover:text-rose-600 dark:border-slate-600 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-rose-300"
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

    <div class="flex min-h-0 flex-col p-3">
      <div class="min-w-0">
        <h2 class="line-clamp-2 min-w-0 text-sm font-bold leading-5 text-slate-950 dark:text-slate-50">
          {{ product.name }}
        </h2>
      </div>

      <div class="mt-1 flex min-w-0 items-center">
        <span class="min-w-0 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ product.slug }}
        </span>
      </div>

      <p
        v-if="vendorName"
        class="mt-2 truncate rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-800 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-200"
        :title="vendorName"
      >
        {{ vendorName }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-3 pt-2">
        <p class="text-base font-black text-emerald-600 dark:text-emerald-300">
          {{ formattedPrice }}
        </p>
      </div>
    </div>
  </article>
</template>
