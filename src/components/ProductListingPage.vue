<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useWishlistStore } from "../stores/wishlistStore";

import FilterPanel from "./FilterPanel.vue";
import ProductCard from "./ProductCard.vue";

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["view-product"]);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const defaultFilters = {
  query: "",
  brand: "",
  category: "",
  minPrice: 0,
  maxPrice: 3000,
};
const filterParamKeys = ["q", "brand", "category", "min_price", "max_price"];
const pageSize = 6;

const products = ref([]);
const facets = ref({
  brands: [],
  price_ranges: [],
});
const activeFilters = ref(readFiltersFromUrl());
const nextPageUrl = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
const currentPage = ref(1);
const wishlistStore = useWishlistStore();
let isApplyingUrlState = false;

const hasProducts = computed(() => products.value.length > 0);
const pageCount = computed(() => Math.max(1, Math.ceil(products.value.length / pageSize)));
const visibleProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize;
  return products.value.slice(startIndex, startIndex + pageSize).map((product) => ({
    ...product,
    is_wishlisted: wishlistStore.has(product.id),
  }));
});
const pageTitle = computed(() => props.selectedCategory?.name || "Product Catalog");
const pageSubtitle = computed(() => {
  if (props.selectedCategory?.name) {
    return `Browsing ${props.selectedCategory.name}`;
  }

  return "Browse current tech products without leaving this page.";
});

function productListUrl() {
  const params = filtersToSearchParams(activeFilters.value);
  const queryString = params.toString();
  const baseUrl = `${apiBaseUrl}/api/v1/catalog/products/search/`;
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

function filtersToSearchParams(filters) {
  const params = new URLSearchParams();

  if (filters.brand) params.set("brand", filters.brand);
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (Number(filters.minPrice) > defaultFilters.minPrice) {
    params.set("min_price", filters.minPrice);
  }
  if (Number(filters.maxPrice) < defaultFilters.maxPrice) {
    params.set("max_price", filters.maxPrice);
  }

  return params;
}

function normalizePrice(value, fallback) {
  if (value === null || value === "") return fallback;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;

  return Math.min(Math.max(numericValue, 0), defaultFilters.maxPrice);
}

function readFiltersFromUrl() {
  if (typeof window === "undefined") {
    return { ...defaultFilters };
  }

  const params = new URLSearchParams(window.location.search);
  const minPrice = normalizePrice(params.get("min_price"), defaultFilters.minPrice);
  const maxPrice = normalizePrice(params.get("max_price"), defaultFilters.maxPrice);

  return {
    query: params.get("q") || defaultFilters.query,
    brand: params.get("brand") || defaultFilters.brand,
    category: params.get("category") || defaultFilters.category,
    minPrice: Math.min(minPrice, maxPrice),
    maxPrice: Math.max(minPrice, maxPrice),
  };
}

function syncFiltersToUrl(filters, replace = false) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const filterParams = filtersToSearchParams(filters);

  filterParamKeys.forEach((key) => params.delete(key));
  filterParams.forEach((value, key) => params.set(key, value));

  const queryString = params.toString();
  const nextSearch = queryString ? `?${queryString}` : "";
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) return;

  window.history[replace ? "replaceState" : "pushState"]({}, "", nextUrl);
}

function applyFiltersFromUrl() {
  isApplyingUrlState = true;
  activeFilters.value = readFiltersFromUrl();
}

function handleSearchChange() {
  applyFiltersFromUrl();
}

function resolveApiUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${apiBaseUrl}${url}`;
}

async function fetchProducts(url, append = false) {
  if (isLoading.value) return;

  errorMessage.value = "";
  isLoading.value = true;

  try {
    const response = await fetch(resolveApiUrl(url));

    if (!response.ok) {
      throw new Error("Could not load products.");
    }

    const payload = await response.json();
    const nextProducts = payload.results || [];

    products.value = append ? [...products.value, ...nextProducts] : nextProducts;
    facets.value = payload.facets || facets.value;
    nextPageUrl.value = payload.next;
  } catch (error) {
    errorMessage.value = error.message || "Could not load products.";
  } finally {
    isLoading.value = false;
  }
}

async function loadFirstPage() {
  currentPage.value = 1;
  nextPageUrl.value = null;
  await fetchProducts(productListUrl());
}

function clearFilters() {
  activeFilters.value = { ...defaultFilters };
}

async function loadNextServerPage() {
  if (!nextPageUrl.value) return false;
  await fetchProducts(nextPageUrl.value, true);
  return true;
}

async function goToPage(page) {
  const requestedPage = Math.max(1, page);

  while (requestedPage > pageCount.value && nextPageUrl.value) {
    await loadNextServerPage();
  }

  currentPage.value = Math.min(requestedPage, pageCount.value);
}

async function goNext() {
  if (currentPage.value < pageCount.value) {
    currentPage.value += 1;
    return;
  }

  if (nextPageUrl.value) {
    const loaded = await loadNextServerPage();
    if (loaded) currentPage.value += 1;
  }
}

function handleWishlistToggle({ product }) {
  wishlistStore.toggle(product);
}

onMounted(() => {
  syncFiltersToUrl(activeFilters.value, true);
  window.addEventListener("popstate", applyFiltersFromUrl);
  window.addEventListener("catalog-search-change", handleSearchChange);
  fetchProducts(productListUrl());
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", applyFiltersFromUrl);
  window.removeEventListener("catalog-search-change", handleSearchChange);
});

watch(
  () => props.selectedCategory?.slug,
  (nextSlug, previousSlug) => {
    if (!nextSlug && previousSlug === undefined) return;

    activeFilters.value = {
      ...activeFilters.value,
      category: nextSlug || "",
    };
  },
  { immediate: true }
);

watch(
  activeFilters,
  () => {
    if (isApplyingUrlState) {
      isApplyingUrlState = false;
    } else {
      syncFiltersToUrl(activeFilters.value);
    }

    loadFirstPage();
  },
  { deep: true }
);
</script>

<template>
  <section class="flex min-h-0 min-w-0 flex-1 bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <FilterPanel v-model="activeFilters" :facets="facets" @clear="clearFilters" />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-3">
      <div class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5 dark:border-slate-800">
        <div class="min-w-0">
          <h1 class="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Catalog <span class="text-slate-400">|</span> {{ pageTitle }}
          </h1>
        </div>

        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {{ products.length }} loaded
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <div v-if="isLoading" class="grid h-full grid-rows-3 gap-3 md:grid-cols-2">
          <div
            v-for="item in 6"
            :key="item"
            class="min-h-0 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          ></div>
        </div>

        <div
          v-else-if="errorMessage"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>

        <div
          v-else-if="!hasProducts"
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">No products found.</p>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Products will appear here after they are published.
          </p>
        </div>

        <div v-else class="grid h-full min-h-0 grid-rows-3 gap-3 md:grid-cols-2">
          <ProductCard
            v-for="product in visibleProducts"
            :key="product.id"
            :product="product"
            @view="emit('view-product', $event)"
            @toggle-wishlist="handleWishlistToggle"
          />
        </div>
      </div>

      <div
        v-if="hasProducts"
        class="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800"
      >
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
          Page {{ currentPage }} of {{ pageCount }}{{ nextPageUrl ? "+" : "" }}
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>
          <button
            v-for="page in pageCount"
            :key="page"
            type="button"
            class="h-9 min-w-9 rounded-lg border px-3 text-xs font-bold transition"
            :class="
              page === currentPage
                ? 'border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900'
            "
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            :disabled="currentPage === pageCount && !nextPageUrl"
            @click="goNext"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
