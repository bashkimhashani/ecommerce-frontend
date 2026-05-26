import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";

const THEME_LIGHT = "light";
const THEME_DARK = "dark";

function themeKey(user) {
  const userKey = user?.id || user?.email || "guest";
  return `vendoraTheme:${userKey}`;
}

function validTheme(theme) {
  return theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
}

function readTheme(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return THEME_LIGHT;
  }
}

function writeTheme(key, mode) {
  try {
    localStorage.setItem(key, mode);
  } catch {
    sessionStorage.setItem(key, mode);
  }
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: THEME_LIGHT,
  }),
  getters: {
    isDark: (state) => state.mode === THEME_DARK,
  },
  actions: {
    init() {
      const authStore = useAuthStore();
      this.mode = validTheme(readTheme(themeKey(authStore.user)));
      this.applyTheme();
    },
    syncForCurrentUser() {
      const authStore = useAuthStore();
      this.mode = validTheme(readTheme(themeKey(authStore.user)));
      this.applyTheme();
    },
    setMode(mode) {
      const authStore = useAuthStore();
      this.mode = validTheme(mode);
      this.applyTheme();
      writeTheme(themeKey(authStore.user), this.mode);
    },
    toggleMode() {
      this.setMode(this.isDark ? THEME_LIGHT : THEME_DARK);
    },
    applyTheme() {
      document.documentElement.classList.toggle("dark", this.isDark);
      document.documentElement.style.colorScheme = this.isDark ? "dark" : "light";
    },
  },
});
