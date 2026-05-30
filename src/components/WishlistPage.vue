<script setup>
import { computed, onMounted } from "vue";

import { useWishlistStore } from "../stores/wishlistStore";
import ProductCard from "./ProductCard.vue";

const emit = defineEmits(["view-product"]);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const wishlistStore = useWishlistStore();

const wishlistProducts = computed(() =>
  wishlistStore.items.map((product) => ({
    ...product,
    is_wishlisted: true,
  }))
);

function handleWishlistToggle({ product }) {
  wishlistStore.remove(product.id);
}

function hasImage(product) {
  return Boolean(
    product.thumbnail ||
      product.product_thumbnail ||
      product.image_url ||
      product.image ||
      product.primary_image ||
      product.images?.length
  );
}

async function hydrateMissingImages() {
  const missingProducts = wishlistStore.items.filter((product) => product.slug && !hasImage(product));

  await Promise.all(
    missingProducts.map(async (product) => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/catalog/products/${product.slug}/`);
        const payload = await response.json().catch(() => ({}));

        if (response.ok) {
          wishlistStore.update(payload);
        }
      } catch {
        // Keep the saved wishlist item; the card will show its text fallback.
      }
    })
  );
}

onMounted(hydrateMissingImages);
</script>

<template>
  <main
    class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
  >
    <section class="min-h-[calc(100vh-81px)] px-6 py-5">
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800"
      >
        <div>
          <h1 class="text-xl font-semibold text-slate-950 dark:text-white">Wishlist</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Products you saved for later.
          </p>
        </div>

        <button
          v-if="wishlistStore.count"
          type="button"
          class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          @click="wishlistStore.clear()"
        >
          Clear wishlist
        </button>
      </div>

      <div
        v-if="wishlistProducts.length"
        class="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <ProductCard
          v-for="product in wishlistProducts"
          :key="product.id"
          :product="product"
          @view="emit('view-product', $event)"
          @toggle-wishlist="handleWishlistToggle"
        />
      </div>

      <div
        v-else
        class="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-900"
      >
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">
          Your wishlist is empty.
        </p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Use the heart button on product cards to save items here.
        </p>
      </div>
    </section>
  </main>
</template>
