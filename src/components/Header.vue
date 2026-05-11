<script setup>
import NavigationBar from './NavigationBar.vue'
import Searchbar from './Searchbar.vue'
</script>

<template>
  <header class="border-b border-neutral-200 bg-white">
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
      <div class="flex items-center justify-between gap-4">
        <img class="h-10 w-auto" src="../assets/images/logo.png" alt="Vendora">
      </div>

      <NavigationBar />
      <Searchbar />
    </div>
  </header>
</template>
