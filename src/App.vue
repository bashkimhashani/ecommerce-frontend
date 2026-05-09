<script setup>
import { ref } from 'vue'

import CategoryTree from './components/CategoryTree.vue'
import Header from './components/Header.vue'
import ProductListingPage from './components/ProductListingPage.vue'

const selectedCategory = ref(null)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <Header />

    <main class="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl border-x border-slate-200 bg-white">
      <CategoryTree @select="selectedCategory = $event" />
      <ProductListingPage :selected-category="selectedCategory" />
    </main>
  </div>
</template>
