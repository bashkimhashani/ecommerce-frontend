<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWishlistStore } from '../stores/wishlistStore'

import FilterPanel from './FilterPanel.vue'
import ProductCard from './ProductCard.vue'


const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['view-product'])

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const defaultFilters = {
  query: '',
  brand: '',
  category: '',
  minPrice: 0,
  maxPrice: 3000,
}
const filterParamKeys = ['q', 'brand', 'category', 'min_price', 'max_price']
const products = ref([])
const facets = ref({
  brands: [],
  price_ranges: [],
})
const activeFilters = ref(readFiltersFromUrl())
const nextPageUrl = ref(null)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const loadMoreMarker = ref(null)
const wishlistStore = useWishlistStore()
let observer = null
let isApplyingUrlState = false

const hasProducts = computed(() => products.value.length > 0)
const pageTitle = computed(() => props.selectedCategory?.name || 'Product Catalog')
const pageSubtitle = computed(() => {
  if (props.selectedCategory?.name) {
    return `Browsing ${props.selectedCategory.name}`
  }

  return 'Browse the latest tech products in the catalog.'
})

function productListUrl() {
  const params = filtersToSearchParams(activeFilters.value)
  const queryString = params.toString()
  const baseUrl = `${apiBaseUrl}/api/v1/catalog/products/search/`
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function filtersToSearchParams(filters) {
  const params = new URLSearchParams()

  if (filters.brand) {
    params.set('brand', filters.brand)
  }
  if (filters.query) {
    params.set('q', filters.query)
  }
  if (filters.category) {
    params.set('category', filters.category)
  }
  if (Number(filters.minPrice) > defaultFilters.minPrice) {
    params.set('min_price', filters.minPrice)
  }
  if (Number(filters.maxPrice) < defaultFilters.maxPrice) {
    params.set('max_price', filters.maxPrice)
  }

  return params
}

function normalizePrice(value, fallback) {
  if (value === null || value === '') {
    return fallback
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return fallback
  }

  return Math.min(Math.max(numericValue, 0), defaultFilters.maxPrice)
}

function readFiltersFromUrl() {
  if (typeof window === 'undefined') {
    return { ...defaultFilters }
  }

  const params = new URLSearchParams(window.location.search)
  const minPrice = normalizePrice(
    params.get('min_price'),
    defaultFilters.minPrice,
  )
  const maxPrice = normalizePrice(
    params.get('max_price'),
    defaultFilters.maxPrice,
  )

  return {
    query: params.get('q') || defaultFilters.query,
    brand: params.get('brand') || defaultFilters.brand,
    category: params.get('category') || defaultFilters.category,
    minPrice: Math.min(minPrice, maxPrice),
    maxPrice: Math.max(minPrice, maxPrice),
  }
}

function syncFiltersToUrl(filters, replace = false) {
  if (typeof window === 'undefined') {
    return
  }

  const params = new URLSearchParams(window.location.search)
  const filterParams = filtersToSearchParams(filters)

  filterParamKeys.forEach((key) => {
    params.delete(key)
  })
  filterParams.forEach((value, key) => {
    params.set(key, value)
  })

  const queryString = params.toString()
  const nextSearch = queryString ? `?${queryString}` : ''
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`
  const currentUrl = (
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  )

  if (nextUrl === currentUrl) {
    return
  }

  const method = replace ? 'replaceState' : 'pushState'
  window.history[method]({}, '', nextUrl)
}

function applyFiltersFromUrl() {
  isApplyingUrlState = true
  activeFilters.value = readFiltersFromUrl()
}

function handleSearchChange() {
  applyFiltersFromUrl()
}

function resolveApiUrl(url) {
  if (!url) {
    return null
  }

  if (url.startsWith('http')) {
    return url
  }

  return `${apiBaseUrl}${url}`
}

async function fetchProducts(url, append = false) {
  if (isLoading.value || isLoadingMore.value) {
    return
  }

  errorMessage.value = ''
  isLoading.value = !append
  isLoadingMore.value = append

  try {
    const response = await fetch(resolveApiUrl(url))

    if (!response.ok) {
      throw new Error('Could not load products.')
    }

    const payload = await response.json()
    const nextProducts = payload.results || []

    products.value = append ? [...products.value, ...nextProducts] : nextProducts
    facets.value = payload.facets || facets.value
    nextPageUrl.value = payload.next
    await nextTick()
    setupInfiniteScroll()
  } catch (error) {
    errorMessage.value = error.message || 'Could not load products.'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

function loadFirstPage() {
  products.value = []
  nextPageUrl.value = null
  observer?.disconnect()
  observer = null
  fetchProducts(productListUrl())
}

function clearFilters() {
  activeFilters.value = { ...defaultFilters }
}

function loadNextPage() {
  if (!nextPageUrl.value) {
    return
  }

  fetchProducts(nextPageUrl.value, true)
}

function setupInfiniteScroll() {
  if (!loadMoreMarker.value || observer) {
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && nextPageUrl.value) {
        loadNextPage()
      }
    },
    {
      rootMargin: '320px 0px',
    },
  )
  observer.observe(loadMoreMarker.value)
}
function handleWishlistToggle({ product }) {
  wishlistStore.toggle(product)
}

onMounted(() => {
  syncFiltersToUrl(activeFilters.value, true)
  window.addEventListener('popstate', applyFiltersFromUrl)
  window.addEventListener('catalog-search-change', handleSearchChange)
  fetchProducts(productListUrl())
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('popstate', applyFiltersFromUrl)
  window.removeEventListener('catalog-search-change', handleSearchChange)
})

watch(() => props.selectedCategory?.slug, (nextSlug, previousSlug) => {
  if (!nextSlug && previousSlug === undefined) {
    return
  }

  activeFilters.value = {
    ...activeFilters.value,
    category: nextSlug || '',
  }
}, { immediate: true })

watch(activeFilters, () => {
  if (isApplyingUrlState) {
    isApplyingUrlState = false
  } else {
    syncFiltersToUrl(activeFilters.value)
  }

  loadFirstPage()
}, { deep: true })
</script>

<template>
  <section class="flex min-w-0 flex-1 flex-col bg-transparent text-slate-950 dark:text-slate-100 lg:flex-row">
    <FilterPanel
      v-model="activeFilters"
      :facets="facets"
      @clear="clearFilters"
    />

    <div class="min-w-0 flex-1 px-5 py-5 sm:px-6">
      <div class="mb-5 overflow-hidden rounded-2xl border border-cyan-100 bg-slate-950 text-white shadow-xl shadow-cyan-950/15 dark:border-cyan-400/10">
        <div class="bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(139,92,246,0.18)_45%,rgba(16,185,129,0.22))] px-5 py-5 sm:px-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                Live tech marketplace
              </p>
              <h1 class="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {{ pageTitle }}
              </h1>
              <p class="mt-2 max-w-2xl text-sm font-medium text-slate-300">
                {{ pageSubtitle }}
              </p>
            </div>

            <div class="grid min-w-40 gap-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur">
              <span class="text-3xl font-black text-cyan-200">{{ products.length }}</span>
              <span class="text-xs font-bold uppercase tracking-wide text-slate-300">products loaded</span>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span class="rounded-full bg-cyan-400/15 px-3 py-1.5 text-cyan-100">Fast catalog search</span>
            <span class="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-100">Vendor verified stock</span>
            <span class="rounded-full bg-amber-400/15 px-3 py-1.5 text-amber-100">Repair services included</span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-100 pb-4 dark:border-cyan-400/10">
        <div>
          <h2 class="text-base font-bold text-slate-950 dark:text-white">
            Featured hardware
          </h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compare devices, parts, and services from active vendors.
          </p>
        </div>

        <div class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-200">
          Updated inventory
        </div>
      </div>

      <div class="py-5">
        <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in 9"
            :key="item"
            class="h-80 animate-pulse rounded-2xl border border-cyan-100 bg-cyan-50/70 dark:border-cyan-400/10 dark:bg-slate-900"
          ></div>
        </div>

        <div v-else-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {{ errorMessage }}
        </div>

        <div v-else-if="!hasProducts" class="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-12 text-center dark:border-cyan-400/10 dark:bg-slate-900">
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">No products found.</p>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Products will appear here after they are published.</p>
        </div>

        <template v-else>
          <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @view="emit('view-product', $event)"
              @toggle-wishlist="handleWishlistToggle"
            />
          </div>

          <div ref="loadMoreMarker" class="flex min-h-20 items-center justify-center py-6">
            <div v-if="isLoadingMore" class="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading more products...
            </div>
            <button
              v-else-if="nextPageUrl"
              type="button"
              class="rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm hover:bg-cyan-50 dark:border-cyan-400/20 dark:bg-slate-950 dark:text-cyan-200 dark:hover:bg-cyan-950/40"
              @click="loadNextPage"
            >
              Load more
            </button>
            <p v-else class="text-sm text-slate-500 dark:text-slate-400">
              End of catalog
            </p>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
