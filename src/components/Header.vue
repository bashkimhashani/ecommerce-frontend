<script setup>
import { computed } from "vue";
import { usePermission } from "../composables/usePermission";
import { useAuthStore } from "../stores/authStore";
import NavigationBar from "./NavigationBar.vue";
import SearchBar from "./SearchBar.vue";
import ThemeToggle from "./ThemeToggle.vue";

defineProps({
  activeView: {
    type: String,
    default: "catalog",
  },
  selectedCategorySlug: {
    type: String,
    default: "",
  },
  wishlistCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "select-category",
  "show-catalog",
  "show-wishlist",
  "show-vendor",
  "show-orders",
  "show-profile",
  "show-login",
  "show-register",
  "show-tenant-register",
]);

const authStore = useAuthStore();
const { can } = usePermission();

const canViewVendor = computed(
  () => can("read", "vendor") || can("manage", "vendor") || can("read", "inventory")
);

const canViewOrders = computed(() => authStore.role === "customer" && can("read", "order"));

const profileImage = computed(
  () => authStore.user?.avatar_thumbnail || authStore.user?.avatar || ""
);

const profileInitials = computed(() => {
  const firstInitial = authStore.user?.first_name?.charAt(0) || "";
  const lastInitial = authStore.user?.last_name?.charAt(0) || "";
  return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
});
</script>

<template>
  <header
    class="shrink-0 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95"
  >
    <div class="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2">
      <button
        type="button"
        class="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-400/40"
        aria-label="Show catalog"
        @click="emit('show-catalog')"
      >
        <img class="h-8 w-auto" src="../assets/images/logo.png" alt="Vendora" />
        <span class="hidden text-sm font-black text-slate-950 dark:text-white sm:block">Vendora</span>
      </button>

      <div class="min-w-0 flex-1">
        <NavigationBar
          :selected-slug="selectedCategorySlug"
          @select-category="emit('select-category', $event)"
        />
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <button
          v-if="canViewVendor"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition"
          :class="
            activeView === 'vendor'
              ? 'bg-slate-950 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
          "
          @click="emit('show-vendor')"
        >
          Vendor
        </button>

        <button
          v-if="canViewOrders"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition"
          :class="
            activeView === 'orders'
              ? 'bg-slate-950 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
          "
          @click="emit('show-orders')"
        >
          Orders
        </button>

        <ThemeToggle />

        <button
          type="button"
          class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition"
          :class="
            activeView === 'wishlist'
              ? 'border-rose-300 bg-rose-500 text-white shadow-sm shadow-rose-900/20 dark:border-rose-300 dark:bg-rose-400 dark:text-slate-950'
              : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-400/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-200'
          "
          aria-label="Open wishlist"
          title="Wishlist"
          @click="emit('show-wishlist')"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M20.8 4.6c-1.5-1.4-3.9-1.4-5.4.1L12 8.1 8.6 4.7C7.1 3.2 4.7 3.1 3.2 4.6c-1.7 1.6-1.7 4.2-.1 5.9l8.9 8.9 8.9-8.9c1.6-1.7 1.6-4.3-.1-5.9Z"
              :fill="activeView === 'wishlist' ? 'currentColor' : 'none'"
            />
          </svg>
          <span
            v-if="wishlistCount"
            class="absolute -right-1 -top-1 flex min-w-5 justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white ring-2 ring-white dark:bg-rose-300 dark:text-slate-950 dark:ring-slate-900"
          >
            {{ wishlistCount }}
          </span>
        </button>

        <button
          v-if="authStore.isAuthenticated"
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition"
          :class="
            activeView === 'profile'
              ? 'border-slate-950 bg-slate-950 text-white shadow-sm dark:border-slate-200 dark:bg-slate-200 dark:text-slate-950'
              : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:text-white'
          "
          aria-label="Open profile"
          title="Profile"
          @click="emit('show-profile')"
        >
          <img v-if="profileImage" class="h-full w-full object-cover" :src="profileImage" alt="" />
          <span v-else>{{ profileInitials }}</span>
        </button>
      </div>

      <div class="order-last min-w-0 flex-[1_1_100%] lg:order-none lg:min-w-64 lg:flex-[0_1_22rem]">
        <SearchBar />
      </div>
    </div>
  </header>
</template>
