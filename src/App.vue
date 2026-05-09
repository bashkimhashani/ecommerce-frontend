<script setup>
import { ref } from 'vue'

import CategoryTree from './components/CategoryTree.vue'
import Header from './components/Header.vue'
import ProductDetailPage from './components/ProductDetailPage.vue'
import ProductListingPage from './components/ProductListingPage.vue'
import VendorProductForm from './components/VendorProductForm.vue'

const selectedCategory = ref(null)
const selectedProductSlug = ref('')
const activeView = ref('catalog')

function selectCategory(category) {
  selectedCategory.value = category
  selectedProductSlug.value = ''
  activeView.value = 'catalog'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <Header />

    <div class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
      <div class="flex justify-end border-b border-slate-200 px-4 py-3">
        <div class="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold"
            :class="activeView === 'catalog' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="activeView = 'catalog'"
          >
            Catalog
          </button>
          <button
            type="button"
            class="rounded px-3 py-1.5 text-sm font-semibold"
            :class="activeView === 'vendor' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="activeView = 'vendor'"
          >
            Vendor
          </button>
        </div>
      </div>

      <main class="flex min-h-[calc(100vh-137px)] w-full bg-white">
        <VendorProductForm v-if="activeView === 'vendor'" />
        <template v-else>
          <CategoryTree @select="selectCategory" />
          <ProductDetailPage
            v-if="selectedProductSlug"
            :slug="selectedProductSlug"
            @back="selectedProductSlug = ''"
          />
          <ProductListingPage
            v-else
            :selected-category="selectedCategory"
            @view-product="selectedProductSlug = $event"
          />
        </template>
      </main>
    </div>
  </div>
</template>
