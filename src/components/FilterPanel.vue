<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  facets: {
    type: Object,
    default: () => ({
      brands: [],
      price_ranges: [],
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'clear'])

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const categories = ref([])
const isLoadingCategories = ref(false)
const categoryError = ref('')
const minPrice = ref(Number(props.modelValue.minPrice || 0))
const maxPrice = ref(Number(props.modelValue.maxPrice || 3000))

const flattenedCategories = computed(() => flattenCategories(categories.value))
const hasActiveFilters = computed(() => (
  Boolean(props.modelValue.brand)
  || Boolean(props.modelValue.category)
  || Number(props.modelValue.minPrice || 0) > 0
  || Number(props.modelValue.maxPrice || 3000) < 3000
))

function flattenCategories(items, depth = 0, output = []) {
  items.forEach((category) => {
    output.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      depth,
    })
    flattenCategories(category.children || [], depth + 1, output)
  })
  return output
}

function updateFilter(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function updatePriceRange() {
  const nextMinPrice = Math.min(Number(minPrice.value), Number(maxPrice.value))
  const nextMaxPrice = Math.max(Number(minPrice.value), Number(maxPrice.value))
  minPrice.value = nextMinPrice
  maxPrice.value = nextMaxPrice
  emit('update:modelValue', {
    ...props.modelValue,
    minPrice: nextMinPrice,
    maxPrice: nextMaxPrice,
  })
}

function toggleBrand(slug) {
  updateFilter('brand', props.modelValue.brand === slug ? '' : slug)
}

function clearFilters() {
  minPrice.value = 0
  maxPrice.value = 3000
  emit('clear')
}

async function loadCategories() {
  isLoadingCategories.value = true
  categoryError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/catalog/categories/tree/`)

    if (!response.ok) {
      throw new Error('Could not load categories.')
    }

    categories.value = await response.json()
  } catch (error) {
    categoryError.value = error.message || 'Could not load categories.'
  } finally {
    isLoadingCategories.value = false
  }
}

watch(
  () => [props.modelValue.minPrice, props.modelValue.maxPrice],
  ([nextMinPrice, nextMaxPrice]) => {
    minPrice.value = Number(nextMinPrice || 0)
    maxPrice.value = Number(nextMaxPrice || 3000)
  },
)

onMounted(loadCategories)
</script>

<template>
  <aside class="w-full shrink-0 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 lg:w-72 lg:border-b-0 lg:border-r">
    <div class="space-y-5 p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
          Filters
        </h2>
        <button
          type="button"
          class="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          :disabled="!hasActiveFilters"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Price
          </h3>
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
            ${{ minPrice }} - ${{ maxPrice }}
          </span>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Minimum
            <input
              v-model.number="minPrice"
              type="range"
              min="0"
              max="3000"
              step="50"
              class="mt-2 w-full accent-slate-900 dark:accent-slate-200"
              @change="updatePriceRange"
            >
          </label>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Maximum
            <input
              v-model.number="maxPrice"
              type="range"
              min="0"
              max="3000"
              step="50"
              class="mt-2 w-full accent-slate-900 dark:accent-slate-200"
              @change="updatePriceRange"
            >
          </label>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Brands
        </h3>
        <div v-if="facets.brands?.length" class="space-y-2">
          <label
            v-for="brand in facets.brands"
            :key="brand.slug"
            class="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            <span class="flex min-w-0 items-center gap-2">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                :checked="modelValue.brand === brand.slug"
                @change="toggleBrand(brand.slug)"
              >
              <span class="truncate text-slate-700 dark:text-slate-200">{{ brand.name }}</span>
            </span>
            <span class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
              {{ brand.count }}
            </span>
          </label>
        </div>
        <p v-else class="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          No brand facets yet.
        </p>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Category
        </h3>
        <select
          class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          :value="modelValue.category || ''"
          @change="updateFilter('category', $event.target.value)"
        >
          <option value="">All categories</option>
          <option
            v-for="category in flattenedCategories"
            :key="category.id"
            :value="category.slug"
          >
            {{ `${'-- '.repeat(category.depth)}${category.name}` }}
          </option>
        </select>
        <p v-if="isLoadingCategories" class="text-xs text-slate-500 dark:text-slate-400">
          Loading categories...
        </p>
        <p v-else-if="categoryError" class="text-xs text-red-600 dark:text-red-300">
          {{ categoryError }}
        </p>
      </section>
    </div>
  </aside>
</template>
