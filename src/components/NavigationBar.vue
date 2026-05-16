<script setup>
const categories = [
  'Laptops',
  'Desktop PCs',
  'Networking',
  'Printers',
  'PC Parts',
  'Repairs',
]
</script>

<template>
  <nav class="flex-1 overflow-x-auto" aria-label="Product categories">
    <ul class="flex min-w-max items-center gap-5 text-sm font-medium text-neutral-600">
      <li v-for="category in categories" :key="category">
        <a class="transition hover:text-neutral-950" href="#">
          {{ category }}
        </a>
      </li>
    </ul>
  </nav>
</template>
