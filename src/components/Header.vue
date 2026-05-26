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

const showAuthLinks = computed(() => !authStore.isAuthenticated);

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
    class="sticky top-0 z-30 border-b border-cyan-200/60 bg-white/90 shadow-lg shadow-cyan-950/5 backdrop-blur-xl transition-colors duration-300 dark:border-cyan-400/10 dark:bg-slate-950/90"
  >
    <div
      class="border-b border-slate-900/5 bg-slate-950 text-xs font-semibold text-cyan-100 dark:border-cyan-400/10"
    >
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-2">
        <span class="text-cyan-300">Vendora Tech Market</span>
        <span class="text-slate-300"
          >Gaming rigs, creator gear, network kits, repairs, and secure checkout.</span
        >
      </div>
    </div>

    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center justify-between gap-4">
          <button
            type="button"
            class="group flex shrink-0 items-center gap-3 rounded-2xl border border-cyan-200 bg-white px-3 py-2 shadow-sm shadow-cyan-900/10 hover:-translate-y-0.5 hover:border-cyan-400 dark:border-cyan-400/20 dark:bg-slate-900"
            aria-label="Show catalog"
            @click="emit('show-catalog')"
          >
            <img class="h-10 w-auto" src="../assets/images/logo.png" alt="Vendora" />
            <span class="hidden text-left sm:block">
              <span
                class="block text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-300"
                >Tech Store</span
              >
              <span class="block text-sm font-black text-slate-950 dark:text-white">Vendora</span>
            </span>
          </button>
        </div>

        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <SearchBar />

          <div
            class="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-inner shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/20"
          >
            <!-- Catalog -->
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold transition"
              :class="
                activeView === 'catalog'
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-900/25 dark:bg-cyan-400 dark:text-slate-950'
                  : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-200'
              "
              @click="emit('show-catalog')"
            >
              Catalog
            </button>

            <!-- Wishlist -->
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold transition"
              :class="
                activeView === 'wishlist'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-900/20 dark:bg-rose-400 dark:text-slate-950'
                  : 'text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-200'
              "
              @click="emit('show-wishlist')"
            >
              Wishlist
              <span
                v-if="wishlistCount"
                class="ml-1 inline-flex min-w-5 justify-center rounded-full bg-white/90 px-1.5 text-xs font-semibold text-rose-700"
              >
                {{ wishlistCount }}
              </span>
            </button>

            <!-- Vendor -->
            <button
              v-if="canViewVendor"
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold transition"
              :class="
                activeView === 'vendor'
                  ? 'bg-violet-500 text-white shadow-sm shadow-violet-900/20 dark:bg-violet-400 dark:text-slate-950'
                  : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-violet-950/40 dark:hover:text-violet-200'
              "
              @click="emit('show-vendor')"
            >
              Vendor
            </button>

            <!-- Orders -->
            <button
              v-if="canViewOrders"
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold transition"
              :class="
                activeView === 'orders'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-900/20 dark:bg-emerald-400 dark:text-slate-950'
                  : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200'
              "
              @click="emit('show-orders')"
            >
              Orders
            </button>

            <!-- Profile -->
            <button
              v-if="authStore.isAuthenticated"
              type="button"
              class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition"
              :class="
                activeView === 'profile'
                  ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-sm shadow-amber-900/20'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-amber-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-300 dark:hover:text-white'
              "
              @click="emit('show-profile')"
            >
              <img
                v-if="profileImage"
                class="h-full w-full object-cover"
                :src="profileImage"
                alt=""
              />
              <span v-else>{{ profileInitials }}</span>
            </button>

            <!-- Auth Links -->
            <button
              v-if="showAuthLinks"
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:text-violet-200 dark:hover:bg-violet-950/40"
              @click="emit('show-tenant-register')"
            >
              Start selling
            </button>

            <button
              v-if="showAuthLinks"
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              @click="emit('show-login')"
            >
              Login
            </button>

            <button
              v-if="showAuthLinks"
              type="button"
              class="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-200"
              @click="emit('show-register')"
            >
              Register
            </button>

            <!-- Theme -->
            <ThemeToggle />
          </div>
        </div>
      </div>

      <NavigationBar
        :selected-slug="selectedCategorySlug"
        @select-category="emit('select-category', $event)"
      />
    </div>
  </header>
</template>
