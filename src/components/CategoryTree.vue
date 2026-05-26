<script setup>
import { computed, onMounted, ref } from "vue";

import CategoryTreeNode from "./CategoryTreeNode.vue";

const emit = defineEmits(["select"]);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const categories = ref([]);
const expandedIds = ref(new Set());
const selectedSlug = ref("");
const isLoading = ref(true);
const errorMessage = ref("");

const categoryCount = computed(() => countCategories(categories.value));

function countCategories(items) {
  return items.reduce((total, item) => total + 1 + countCategories(item.children || []), 0);
}

function setExpandedIds(nextIds) {
  expandedIds.value = new Set(nextIds);
}

function collectExpandableIds(items, ids = []) {
  items.forEach((item) => {
    if (item.children?.length) {
      ids.push(item.id);
      collectExpandableIds(item.children, ids);
    }
  });
  return ids;
}

function toggleCategory(categoryId) {
  const nextIds = new Set(expandedIds.value);

  if (nextIds.has(categoryId)) {
    nextIds.delete(categoryId);
  } else {
    nextIds.add(categoryId);
  }

  expandedIds.value = nextIds;
}

function selectCategory(category) {
  selectedSlug.value = category.slug;
  emit("select", category);
}

async function loadCategories() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/catalog/categories/tree/`);

    if (!response.ok) {
      throw new Error("Could not load categories.");
    }

    categories.value = await response.json();
    setExpandedIds(collectExpandableIds(categories.value));
  } catch (error) {
    errorMessage.value = error.message || "Could not load categories.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCategories);
</script>

<template>
  <aside
    class="w-full max-w-72 shrink-0 border-r border-cyan-100 bg-slate-950 text-slate-100 dark:border-cyan-400/10 dark:bg-slate-950"
  >
    <div class="flex h-full flex-col">
      <div class="border-b border-cyan-400/10 px-4 py-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Categories</h2>
          <span class="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-black text-slate-950">
            {{ categoryCount }}
          </span>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-3">
        <div v-if="isLoading" class="space-y-2">
          <div
            v-for="item in 6"
            :key="item"
            class="h-9 animate-pulse rounded-xl bg-slate-800"
          ></div>
        </div>

        <p v-else-if="errorMessage" class="rounded-xl bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {{ errorMessage }}
        </p>

        <p v-else-if="!categories.length" class="px-1 py-2 text-sm text-slate-400">
          No categories found.
        </p>

        <ul v-else class="space-y-1">
          <CategoryTreeNode
            v-for="category in categories"
            :key="category.id"
            :category="category"
            :expanded-ids="expandedIds"
            :selected-slug="selectedSlug"
            @toggle="toggleCategory"
            @select="selectCategory"
          />
        </ul>
      </div>
    </div>
  </aside>
</template>
