<script setup>
import { ref } from 'vue'

import CategoryTree from './components/CategoryTree.vue'
import Header from './components/Header.vue'

const selectedCategory = ref(null)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <Header />

    <main class="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl border-x border-slate-200 bg-white">
      <CategoryTree @select="selectedCategory = $event" />

      <section class="min-w-0 flex-1 px-6 py-5">
        <div class="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 class="text-xl font-semibold text-slate-950">
              {{ selectedCategory?.name || 'Product Catalog' }}
            </h1>
            <p class="mt-1 text-sm text-slate-500">
              Tech products for the current store
            </p>
          </div>
        </div>

        <div class="grid gap-4 py-5 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in 6"
            :key="item"
            class="h-36 rounded-md border border-slate-200 bg-slate-50"
          ></div>
        </div>
      </section>
    </main>
  </div>
</template>
