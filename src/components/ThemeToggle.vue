<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/themeStore'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

function toggleTheme() {
  themeStore.toggleMode()
}
</script>

<template>
  <button
    type="button"
    class="flex min-h-10 min-w-20 items-center justify-center rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Light mode' : 'Dark mode'"
    @click="toggleTheme"
  >
    {{ isDark ? 'Light' : 'Dark' }}
  </button>
</template>
