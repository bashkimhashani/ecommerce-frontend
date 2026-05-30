<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  buildCatalogSearchLocation,
  readCatalogSearchQuery,
} from "../utils/catalogSearchRoute";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const route = useRoute();
const router = useRouter();
const query = ref(readCatalogSearchQuery(route.query));
const suggestions = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");
const isOpen = ref(false);
const selectedIndex = ref(-1);
let debounceTimer = null;
let abortController = null;
let suppressNextSuggestionLoad = false;

const hasSuggestions = computed(() => suggestions.value.length > 0);

async function syncQueryToUrl(nextQuery) {
  if (typeof window === "undefined") {
    return;
  }

  await router.push(buildCatalogSearchLocation(route.query, nextQuery));

  window.dispatchEvent(new CustomEvent("catalog-search-change"));
}

function resetDropdown() {
  suggestions.value = [];
  selectedIndex.value = -1;
  isOpen.value = false;
}

async function loadSuggestions(searchTerm) {
  const cleanQuery = searchTerm.trim();

  if (cleanQuery.length < 2) {
    resetDropdown();
    return;
  }

  abortController?.abort();
  abortController = new AbortController();
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const params = new URLSearchParams({ q: cleanQuery });
    const response = await fetch(
      `${apiBaseUrl}/api/v1/catalog/autocomplete/?${params.toString()}`,
      { signal: abortController.signal }
    );

    if (!response.ok) {
      throw new Error("Could not load suggestions.");
    }

    const payload = await response.json();
    suggestions.value = payload.suggestions || [];
    selectedIndex.value = suggestions.value.length ? 0 : -1;
    isOpen.value = true;
  } catch (error) {
    if (error.name !== "AbortError") {
      errorMessage.value = error.message || "Could not load suggestions.";
      suggestions.value = [];
      isOpen.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

async function submitSearch(nextQuery = query.value) {
  suppressNextSuggestionLoad = true;
  query.value = nextQuery;
  await syncQueryToUrl(nextQuery);
  resetDropdown();
}

async function clearSearch() {
  suppressNextSuggestionLoad = true;
  query.value = "";
  await syncQueryToUrl("");
  resetDropdown();
}

function selectSuggestion(suggestion) {
  submitSearch(suggestion);
}

function moveSelection(direction) {
  if (!hasSuggestions.value) {
    return;
  }

  const lastIndex = suggestions.value.length - 1;
  if (direction === "next") {
    selectedIndex.value = selectedIndex.value >= lastIndex ? 0 : selectedIndex.value + 1;
  } else {
    selectedIndex.value = selectedIndex.value <= 0 ? lastIndex : selectedIndex.value - 1;
  }
}

function handleEnter() {
  if (isOpen.value && selectedIndex.value >= 0) {
    selectSuggestion(suggestions.value[selectedIndex.value]);
    return;
  }

  submitSearch();
}

function handleOutsideClick(event) {
  if (event.target instanceof Element && !event.target.closest("[data-search-bar]")) {
    isOpen.value = false;
  }
}

function handleUrlSearchChange() {
  query.value = readCatalogSearchQuery(route.query);
}

watch(query, (nextQuery) => {
  window.clearTimeout(debounceTimer);

  if (suppressNextSuggestionLoad) {
    suppressNextSuggestionLoad = false;
    return;
  }

  debounceTimer = window.setTimeout(() => {
    loadSuggestions(nextQuery);
  }, 250);
});

onMounted(() => {
  window.addEventListener("click", handleOutsideClick);
  window.addEventListener("popstate", handleUrlSearchChange);
});

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer);
  abortController?.abort();
  window.removeEventListener("click", handleOutsideClick);
  window.removeEventListener("popstate", handleUrlSearchChange);
});
</script>

<template>
  <div data-search-bar class="relative w-full">
    <form
      class="flex items-center rounded-xl border border-cyan-200 bg-white shadow-sm shadow-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100 dark:border-cyan-400/20 dark:bg-slate-900 dark:focus-within:border-cyan-300 dark:focus-within:ring-cyan-950/70"
      @submit.prevent="submitSearch()"
    >
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        class="min-w-0 flex-1 rounded-l-xl bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        placeholder="Search laptops, GPUs, routers"
        aria-label="Search products"
        @focus="isOpen = Boolean(query.trim().length >= 2)"
        @keydown.down.prevent="moveSelection('next')"
        @keydown.up.prevent="moveSelection('previous')"
        @keydown.enter.prevent="handleEnter"
        @keydown.esc="isOpen = false"
      />

      <button
        v-if="query"
        type="button"
        class="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-300"
        aria-label="Clear search"
        @click="clearSearch"
      >
        ×
      </button>

      <button
        type="submit"
        class="mr-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-cyan-900/20 hover:bg-cyan-600 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
      >
        Search
      </button>
    </form>

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-2xl shadow-cyan-950/15 dark:border-cyan-400/20 dark:bg-slate-950"
    >
      <div v-if="isLoading" class="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
        Loading suggestions...
      </div>
      <div v-else-if="errorMessage" class="px-3 py-3 text-sm text-red-600 dark:text-red-300">
        {{ errorMessage }}
      </div>
      <ul v-else-if="hasSuggestions" class="max-h-72 overflow-y-auto py-1">
        <li v-for="(suggestion, index) in suggestions" :key="suggestion">
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-cyan-950/40"
            :class="{
              'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100':
                index === selectedIndex,
            }"
            @mousedown.prevent="selectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </li>
      </ul>
      <div v-else class="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
        No suggestions found.
      </div>
    </div>
  </div>
</template>
