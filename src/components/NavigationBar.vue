<script setup>
defineProps({
  selectedSlug: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select-category"]);

const categories = [
  { name: "Laptops", slug: "laptops" },
  { name: "Desktop PCs", slug: "desktop-pcs" },
  { name: "Networking", slug: "networking" },
  { name: "Printers", slug: "printers" },
  { name: "PC Parts", slug: "pc-parts" },
  { name: "Repairs", slug: "repairs" },
];
</script>

<template>
  <nav class="flex-1 overflow-x-auto" aria-label="Product categories">
    <ul
      class="flex min-w-max items-center gap-5 text-sm font-medium text-neutral-600 dark:text-slate-400"
    >
      <li v-for="category in categories" :key="category.slug">
        <button
          type="button"
          class="rounded-md px-2.5 py-2 transition hover:bg-slate-100 hover:text-neutral-950 dark:hover:bg-slate-900 dark:hover:text-white"
          :class="selectedSlug === category.slug ? 'text-neutral-950 dark:text-white' : ''"
          :aria-current="selectedSlug === category.slug ? 'page' : undefined"
          @click="emit('select-category', category)"
        >
          {{ category.name }}
        </button>
      </li>
    </ul>
  </nav>
</template>
