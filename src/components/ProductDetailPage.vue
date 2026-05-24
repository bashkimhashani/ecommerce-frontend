<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['back'])

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const product = ref(null)
const selectedImageIndex = ref(0)
const activeTab = ref('specs')
const isLoading = ref(false)
const errorMessage = ref('')
const addToCartStatus = ref('')

const galleryImages = computed(() => {
  return (product.value?.images || []).map((image) => ({
    ...image,
    src: image.large || image.medium || image.image || image.thumbnail,
  })).filter((image) => image.src)
})

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || null)

const formattedPrice = computed(() => {
  const numericPrice = Number(product.value?.price)

  if (Number.isNaN(numericPrice)) {
    return product.value?.price || ''
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericPrice)
})

const specs = computed(() => Object.entries(product.value?.specs || {}))
const variants = computed(() => product.value?.variants || [])
const totalStock = computed(() => {
  return variants.value.reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0)
})

async function loadProduct() {
  isLoading.value = true
  errorMessage.value = ''
  addToCartStatus.value = ''
  selectedImageIndex.value = 0
  activeTab.value = 'specs'

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/catalog/products/${props.slug}/`)

    if (!response.ok) {
      throw new Error('Could not load product.')
    }

    product.value = await response.json()
  } catch (error) {
    product.value = null
    errorMessage.value = error.message || 'Could not load product.'
  } finally {
    isLoading.value = false
  }
}

function addToCart() {
  addToCartStatus.value = 'Added to cart'
}

onMounted(loadProduct)

watch(() => props.slug, loadProduct)
</script>

<template>
  <section class="min-w-0 flex-1 bg-white px-6 py-5 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <button
      type="button"
      class="mb-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
      @click="emit('back')"
    >
      Back to products
    </button>

    <div v-if="isLoading" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="h-[520px] animate-pulse rounded-md bg-slate-100 dark:bg-slate-900"></div>
      <div class="space-y-4">
        <div class="h-8 animate-pulse rounded-md bg-slate-100 dark:bg-slate-900"></div>
        <div class="h-24 animate-pulse rounded-md bg-slate-100 dark:bg-slate-900"></div>
        <div class="h-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-900"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-else-if="product" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0">
        <div class="overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <img
            v-if="selectedImage"
            :src="selectedImage.src"
            :alt="selectedImage.alt_text || product.name"
            class="aspect-[4/3] w-full object-cover"
          >
          <div v-else class="flex aspect-[4/3] items-center justify-center px-6 text-center text-sm font-medium text-slate-400 dark:text-slate-300">
            {{ product.name }}
          </div>
        </div>

        <div v-if="galleryImages.length > 1" class="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          <button
            v-for="(image, index) in galleryImages"
            :key="image.id"
            type="button"
            class="overflow-hidden rounded-md border bg-slate-100 dark:bg-slate-900"
            :class="index === selectedImageIndex ? 'border-slate-900 ring-2 ring-slate-900 dark:border-slate-200 dark:ring-slate-200' : 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'"
            @click="selectedImageIndex = index"
          >
            <img
              :src="image.thumbnail || image.src"
              :alt="image.alt_text || product.name"
              class="aspect-square w-full object-cover"
            >
          </button>
        </div>

        <div class="mt-6 rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div class="flex border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              class="px-4 py-3 text-sm font-semibold"
              :class="activeTab === 'specs' ? 'border-b-2 border-slate-900 text-slate-950 dark:border-slate-100 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
              @click="activeTab = 'specs'"
            >
              Specs
            </button>
            <button
              type="button"
              class="px-4 py-3 text-sm font-semibold"
              :class="activeTab === 'variants' ? 'border-b-2 border-slate-900 text-slate-950 dark:border-slate-100 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'"
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
                class="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800"
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

            <div v-else-if="variants.length" class="divide-y divide-slate-200 dark:divide-slate-700">
              <div
                v-for="variant in variants"
                :key="variant.id"
                class="grid gap-3 py-3 text-sm sm:grid-cols-4"
              >
                <span class="font-medium text-slate-950 dark:text-slate-100">{{ variant.color || 'Standard' }}</span>
                <span class="text-slate-600 dark:text-slate-300">{{ variant.storage || 'Storage n/a' }}</span>
                <span class="text-slate-600 dark:text-slate-300">{{ variant.ram || 'RAM n/a' }}</span>
                <span class="font-medium text-slate-950 dark:text-slate-100">{{ variant.stock_quantity }} in stock</span>
              </div>
            </div>

            <p v-else class="text-sm text-slate-500 dark:text-slate-400">
              No variants available.
            </p>
          </div>
        </div>
      </div>

      <aside class="h-fit rounded-md border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p class="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          {{ product.brand?.name || 'Brand' }}
        </p>
        <h1 class="mt-2 text-2xl font-semibold leading-tight text-slate-950 dark:text-white">
          {{ product.name }}
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ product.category?.name || 'Product' }} / {{ product.sku }}
        </p>

        <div class="mt-5 flex items-end justify-between gap-4">
          <p class="text-3xl font-semibold text-slate-950 dark:text-white">
            {{ formattedPrice }}
          </p>
          <p class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
            {{ totalStock }} in stock
          </p>
        </div>

        <button
          type="button"
          class="mt-5 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300"
          @click="addToCart"
        >
          Add to cart
        </button>

        <p v-if="addToCartStatus" class="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
          {{ addToCartStatus }}
        </p>
      </aside>
    </div>
  </section>
</template>
