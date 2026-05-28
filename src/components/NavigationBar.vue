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
  <nav class="min-w-0" aria-label="Product categories">
    <ul
      class="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:flex-nowrap"
    >
      <li v-for="category in categories" :key="category.slug">
        <button
          type="button"
          class="whitespace-nowrap rounded-lg border px-2.5 py-1.5 transition hover:-translate-y-0.5"
          :class="
            selectedSlug === category.slug
              ? 'border-cyan-300 bg-cyan-100 text-cyan-800 shadow-sm shadow-cyan-900/10 dark:border-cyan-400/40 dark:bg-cyan-400/15 dark:text-cyan-100'
              : 'border-transparent bg-slate-100/80 hover:border-cyan-200 hover:bg-white hover:text-cyan-700 dark:bg-slate-900 dark:hover:border-cyan-400/30 dark:hover:bg-slate-800 dark:hover:text-cyan-200'
          "
          :aria-current="selectedSlug === category.slug ? 'page' : undefined"
          @click="emit('select-category', category)"
        >
          {{ category.name }}
        </button>
      </li>
    </ul>
  </nav>
</template>
