<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["back"]);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const product = ref(null);
const selectedImageIndex = ref(0);
const activeTab = ref("specs");
const isLoading = ref(false);
const errorMessage = ref("");
const addToCartStatus = ref("");

const galleryImages = computed(() => {
  return (product.value?.images || [])
    .map((image) => ({
      ...image,
      src: image.large || image.medium || image.image || image.thumbnail,
    }))
    .filter((image) => image.src);
});

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || null);

const formattedPrice = computed(() => {
  const numericPrice = Number(product.value?.price);

  if (Number.isNaN(numericPrice)) {
    return product.value?.price || "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericPrice);
});

const specs = computed(() => Object.entries(product.value?.specs || {}));
const variants = computed(() => product.value?.variants || []);
const totalStock = computed(() => {
  return variants.value.reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0);
});

async function loadProduct() {
  isLoading.value = true;
  errorMessage.value = "";
  addToCartStatus.value = "";
  selectedImageIndex.value = 0;
  activeTab.value = "specs";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/catalog/products/${props.slug}/`);

    if (!response.ok) {
      throw new Error("Could not load product.");
    }

    product.value = await response.json();
  } catch (error) {
    product.value = null;
    errorMessage.value = error.message || "Could not load product.";
  } finally {
    isLoading.value = false;
  }
}

function addToCart() {
  addToCartStatus.value = "Added to cart";
}

onMounted(loadProduct);

watch(() => props.slug, loadProduct);
</script>

<template>
  <section
    class="min-w-0 flex-1 bg-transparent px-5 py-5 text-slate-950 dark:text-slate-100 sm:px-6"
  >
    <button
      type="button"
      class="mb-4 rounded-full border border-cyan-200 bg-white px-3 py-2 text-sm font-bold text-cyan-700 shadow-sm hover:bg-cyan-50 dark:border-cyan-400/20 dark:bg-slate-900 dark:text-cyan-200 dark:hover:bg-cyan-950/40"
      @click="emit('back')"
    >
      Back to products
    </button>

    <div v-if="isLoading" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="h-[520px] animate-pulse rounded-2xl bg-cyan-50 dark:bg-slate-900"></div>
      <div class="space-y-4">
        <div class="h-8 animate-pulse rounded-2xl bg-cyan-50 dark:bg-slate-900"></div>
        <div class="h-24 animate-pulse rounded-2xl bg-cyan-50 dark:bg-slate-900"></div>
        <div class="h-12 animate-pulse rounded-2xl bg-cyan-50 dark:bg-slate-900"></div>
      </div>
    </div>

    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <div v-else-if="product" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0">
        <div
          class="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-slate-100 to-emerald-50 shadow-xl shadow-cyan-950/10 dark:border-cyan-400/10 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950"
        >
          <img
            v-if="selectedImage"
            :src="selectedImage.src"
            :alt="selectedImage.alt_text || product.name"
            class="aspect-[4/3] w-full object-cover"
          />
          <div
            v-else
            class="flex aspect-[4/3] items-center justify-center px-6 text-center text-sm font-bold text-slate-400 dark:text-slate-300"
          >
            {{ product.name }}
          </div>
        </div>

        <div v-if="galleryImages.length > 1" class="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          <button
            v-for="(image, index) in galleryImages"
            :key="image.id"
            type="button"
            class="overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-900"
            :class="
              index === selectedImageIndex
                ? 'border-cyan-500 ring-2 ring-cyan-400 dark:border-cyan-300 dark:ring-cyan-300'
                : 'border-slate-200 hover:border-cyan-300 dark:border-slate-700 dark:hover:border-cyan-400/40'
            "
            @click="selectedImageIndex = index"
          >
            <img
              :src="image.thumbnail || image.src"
              :alt="image.alt_text || product.name"
              class="aspect-square w-full object-cover"
            />
          </button>
        </div>

        <div
          class="mt-6 rounded-2xl border border-cyan-100 bg-white shadow-lg shadow-cyan-950/5 dark:border-cyan-400/10 dark:bg-slate-900"
        >
          <div class="flex border-b border-cyan-100 dark:border-cyan-400/10">
            <button
              type="button"
              class="px-4 py-3 text-sm font-semibold"
              :class="
                activeTab === 'specs'
                  ? 'border-b-2 border-cyan-500 text-cyan-700 dark:border-cyan-300 dark:text-cyan-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              "
              @click="activeTab = 'specs'"
            >
              Specs
            </button>
            <button
              type="button"
              class="px-4 py-3 text-sm font-semibold"
              :class="
                activeTab === 'variants'
                  ? 'border-b-2 border-cyan-500 text-cyan-700 dark:border-cyan-300 dark:text-cyan-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              "
              @click="activeTab = 'variants'"
            >
              Variants
            </button>
          </div>

          <div class="p-4">
            <dl v-if="activeTab === 'specs' && specs.length" class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="[label, value] in specs"
                :key="label"
                class="rounded-xl border border-cyan-100 bg-cyan-50/70 px-3 py-2 dark:border-cyan-400/10 dark:bg-slate-800"
              >
                <dt class="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {{ label }}
                </dt>
                <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {{ value }}
                </dd>
              </div>
            </dl>

            <p v-else-if="activeTab === 'specs'" class="text-sm text-slate-500 dark:text-slate-400">
              No specs available.
            </p>

            <div
              v-else-if="variants.length"
              class="divide-y divide-slate-200 dark:divide-slate-700"
            >
              <div
                v-for="variant in variants"
                :key="variant.id"
                class="grid gap-3 py-3 text-sm sm:grid-cols-4"
              >
                <span class="font-medium text-slate-950 dark:text-slate-100">{{
                  variant.color || "Standard"
                }}</span>
                <span class="text-slate-600 dark:text-slate-300">{{
                  variant.storage || "Storage n/a"
                }}</span>
                <span class="text-slate-600 dark:text-slate-300">{{
                  variant.ram || "RAM n/a"
                }}</span>
                <span class="font-medium text-slate-950 dark:text-slate-100"
                  >{{ variant.stock_quantity }} in stock</span
                >
              </div>
            </div>

            <p v-else class="text-sm text-slate-500 dark:text-slate-400">No variants available.</p>
          </div>
        </div>
      </div>

      <aside
        class="h-fit rounded-2xl border border-cyan-100 bg-white p-5 shadow-xl shadow-cyan-950/10 dark:border-cyan-400/10 dark:bg-slate-900"
      >
        <p class="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
          {{ product.brand?.name || "Brand" }}
        </p>
        <h1 class="mt-2 text-2xl font-black leading-tight text-slate-950 dark:text-white">
          {{ product.name }}
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ product.category?.name || "Product" }} / {{ product.sku }}
        </p>

        <div class="mt-5 flex items-end justify-between gap-4">
          <p class="text-3xl font-black text-emerald-600 dark:text-emerald-300">
            {{ formattedPrice }}
          </p>
          <p
            class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
          >
            {{ totalStock }} in stock
          </p>
        </div>

        <button
          type="button"
          class="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-600 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          @click="addToCart"
        >
          Add to cart
        </button>

        <p
          v-if="addToCartStatus"
          class="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          {{ addToCartStatus }}
        </p>
      </aside>
    </div>
  </section>
</template>
