<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const query = ref(readQueryFromUrl())
const suggestions = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const isOpen = ref(false)
const selectedIndex = ref(-1)
let debounceTimer = null
let abortController = null
let suppressNextSuggestionLoad = false

const hasSuggestions = computed(() => suggestions.value.length > 0)

function readQueryFromUrl() {
  if (typeof window === 'undefined') {
    return ''
  }

  return new URLSearchParams(window.location.search).get('q') || ''
}

function syncQueryToUrl(nextQuery) {
  if (typeof window === 'undefined') {
    return
  }

  const params = new URLSearchParams(window.location.search)
  const cleanQuery = nextQuery.trim()

  if (cleanQuery) {
    params.set('q', cleanQuery)
  } else {
    params.delete('q')
  }

  const queryString = params.toString()
  const nextSearch = queryString ? `?${queryString}` : ''
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`
  const currentUrl = (
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  )

  if (nextUrl !== currentUrl) {
    window.history.pushState({}, '', nextUrl)
  }

  window.dispatchEvent(new CustomEvent('catalog-search-change'))
}

function resetDropdown() {
  suggestions.value = []
  selectedIndex.value = -1
  isOpen.value = false
}

async function loadSuggestions(searchTerm) {
  const cleanQuery = searchTerm.trim()

  if (cleanQuery.length < 2) {
    resetDropdown()
    return
  }

  abortController?.abort()
  abortController = new AbortController()
  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({ q: cleanQuery })
    const response = await fetch(
      `${apiBaseUrl}/api/v1/catalog/autocomplete/?${params.toString()}`,
      { signal: abortController.signal },
    )

    if (!response.ok) {
      throw new Error('Could not load suggestions.')
    }

    const payload = await response.json()
    suggestions.value = payload.suggestions || []
    selectedIndex.value = suggestions.value.length ? 0 : -1
    isOpen.value = true
  } catch (error) {
    if (error.name !== 'AbortError') {
      errorMessage.value = error.message || 'Could not load suggestions.'
      suggestions.value = []
      isOpen.value = true
    }
  } finally {
    isLoading.value = false
  }
}

function submitSearch(nextQuery = query.value) {
  suppressNextSuggestionLoad = true
  query.value = nextQuery
  syncQueryToUrl(nextQuery)
  resetDropdown()
}

function clearSearch() {
  suppressNextSuggestionLoad = true
  query.value = ''
  syncQueryToUrl('')
  resetDropdown()
}

function selectSuggestion(suggestion) {
  submitSearch(suggestion)
}

function moveSelection(direction) {
  if (!hasSuggestions.value) {
    return
  }

  const lastIndex = suggestions.value.length - 1
  if (direction === 'next') {
    selectedIndex.value = (
      selectedIndex.value >= lastIndex ? 0 : selectedIndex.value + 1
    )
  } else {
    selectedIndex.value = (
      selectedIndex.value <= 0 ? lastIndex : selectedIndex.value - 1
    )
  }
}

function handleEnter() {
  if (isOpen.value && selectedIndex.value >= 0) {
    selectSuggestion(suggestions.value[selectedIndex.value])
    return
  }

  submitSearch()
}

function handleOutsideClick(event) {
  if (
    event.target instanceof Element
    && !event.target.closest('[data-search-bar]')
  ) {
    isOpen.value = false
  }
}

function handleUrlSearchChange() {
  query.value = readQueryFromUrl()
}

watch(query, (nextQuery) => {
  window.clearTimeout(debounceTimer)

  if (suppressNextSuggestionLoad) {
    suppressNextSuggestionLoad = false
    return
  }

  debounceTimer = window.setTimeout(() => {
    loadSuggestions(nextQuery)
  }, 250)
})

onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
  window.addEventListener('popstate', handleUrlSearchChange)
})

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer)
  abortController?.abort()
  window.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('popstate', handleUrlSearchChange)
})
</script>

<template>
  <div data-search-bar class="relative w-full max-w-md">
    <form
      class="flex items-center rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-slate-400"
      @submit.prevent="submitSearch()"
    >
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        class="min-w-0 flex-1 rounded-l-md px-3 py-2 text-sm text-slate-800 outline-none"
        placeholder="Search products"
        aria-label="Search products"
        @focus="isOpen = Boolean(query.trim().length >= 2)"
        @keydown.down.prevent="moveSelection('next')"
        @keydown.up.prevent="moveSelection('previous')"
        @keydown.enter.prevent="handleEnter"
        @keydown.esc="isOpen = false"
      >

      <button
        v-if="query"
        type="button"
        class="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-slate-700"
        aria-label="Clear search"
        @click="clearSearch"
      >
        ×
      </button>

      <button
        type="submit"
        class="mr-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Search
      </button>
    </form>

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
    >
      <div v-if="isLoading" class="px-3 py-3 text-sm text-slate-500">
        Loading suggestions...
      </div>
      <div v-else-if="errorMessage" class="px-3 py-3 text-sm text-red-600">
        {{ errorMessage }}
      </div>
      <ul v-else-if="hasSuggestions" class="max-h-72 overflow-y-auto py-1">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="suggestion"
        >
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            :class="{ 'bg-slate-100': index === selectedIndex }"
            @mousedown.prevent="selectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </li>
      </ul>
      <div v-else class="px-3 py-3 text-sm text-slate-500">
        No suggestions found.
      </div>
    </div>
  </div>
</template>
