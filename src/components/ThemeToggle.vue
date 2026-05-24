<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const mode = ref(themeStore.mode)
const isDark = computed(() => mode.value === 'dark')

function toggleTheme() {
  mode.value = isDark.value ? 'light' : 'dark'
  themeStore.setMode(mode.value)
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'

  const userKey = authStore.user?.id || authStore.user?.email || 'guest'
  try {
    localStorage.setItem(`vendoraTheme:${userKey}`, mode.value)
  } catch {
    sessionStorage.setItem(`vendoraTheme:${userKey}`, mode.value)
  }
}
</script>

<template>
  <button
    type="button"
    class="flex h-8 min-w-16 items-center justify-center rounded border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Light mode' : 'Dark mode'"
    @click="toggleTheme"
  >
    {{ isDark ? 'Light' : 'Dark' }}
  </button>
</template>
