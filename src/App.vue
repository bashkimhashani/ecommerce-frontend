<script setup>
import { ref } from 'vue'

import CategoryTree from './components/CategoryTree.vue'
import Header from './components/Header.vue'
import ProductDetailPage from './components/ProductDetailPage.vue'
import ProductListingPage from './components/ProductListingPage.vue'

const selectedCategory = ref(null)
const selectedProductSlug = ref('')

function selectCategory(category) {
  selectedCategory.value = category
  selectedProductSlug.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <Header />

    <main class="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl border-x border-slate-200 bg-white">
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
    </main>
  </div>
</template>
