<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import ProductCard from './ProductCard.vue'

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
})

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const products = ref([])
const nextPageUrl = ref(null)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const loadMoreMarker = ref(null)
let observer = null

const hasProducts = computed(() => products.value.length > 0)
const pageTitle = computed(() => props.selectedCategory?.name || 'Product Catalog')
const pageSubtitle = computed(() => {
  if (props.selectedCategory?.name) {
    return `Browsing ${props.selectedCategory.name}`
  }

  return 'Browse the latest tech products in the catalog.'
})

function productListUrl() {
  return `${apiBaseUrl}/api/v1/catalog/products/`
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
  fetchProducts(productListUrl())
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

onMounted(() => {
  fetchProducts(productListUrl())
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

watch(() => props.selectedCategory?.slug, () => {
  loadFirstPage()
})
</script>

<template>
  <section class="min-w-0 flex-1 px-6 py-5">
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-950">
          {{ pageTitle }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ pageSubtitle }}
        </p>
      </div>

      <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
        {{ products.length }} loaded
      </div>
    </div>

    <div class="py-5">
      <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in 9"
          :key="item"
          class="h-80 animate-pulse rounded-md border border-slate-200 bg-slate-50"
        ></div>
      </div>

      <div v-else-if="errorMessage" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <div v-else-if="!hasProducts" class="rounded-md border border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <p class="text-sm font-semibold text-slate-700">No products found.</p>
        <p class="mt-1 text-sm text-slate-500">Products will appear here after they are published.</p>
      </div>

      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div ref="loadMoreMarker" class="flex min-h-20 items-center justify-center py-6">
          <div v-if="isLoadingMore" class="text-sm font-medium text-slate-500">
            Loading more products...
          </div>
          <button
            v-else-if="nextPageUrl"
            type="button"
            class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="loadNextPage"
          >
            Load more
          </button>
          <p v-else class="text-sm text-slate-500">
            End of catalog
          </p>
        </div>
      </template>
    </div>
  </section>
</template>
