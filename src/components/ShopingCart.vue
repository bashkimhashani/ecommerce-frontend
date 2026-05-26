<script setup>
import { computed, onMounted, ref } from "vue";

const emit = defineEmits(["checkout"]);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const isOpen = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const cart = ref({
  items: [],
  total_items: 0,
  subtotal: "0.00",
});
const pendingItemIds = ref(new Set());

const itemCount = computed(() => cart.value?.total_items || 0);
const subtotal = computed(() => Number(cart.value?.subtotal || 0).toFixed(2));

function authHeaders() {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestCart(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.detail || data.quantity?.[0] || "Cart request failed.";
    throw new Error(detail);
  }

  return data;
}

async function loadCart() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    cart.value = await requestCart("/api/v1/cart/");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

async function updateQuantity(item, nextQuantity) {
  if (nextQuantity < 1 || pendingItemIds.value.has(item.id)) {
    return;
  }

  pendingItemIds.value.add(item.id);
  errorMessage.value = "";

  try {
    const updatedItem = await requestCart(`/api/v1/cart/items/${item.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: nextQuantity }),
    });

    cart.value = {
      ...cart.value,
      items: cart.value.items.map((cartItem) =>
        cartItem.id === updatedItem.id ? updatedItem : cartItem
      ),
    };
    recalculateCartTotals();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    pendingItemIds.value.delete(item.id);
  }
}

async function removeItem(item) {
  if (pendingItemIds.value.has(item.id)) {
    return;
  }

  pendingItemIds.value.add(item.id);
  errorMessage.value = "";

  try {
    await requestCart(`/api/v1/cart/items/${item.id}/`, {
      method: "DELETE",
    });

    cart.value = {
      ...cart.value,
      items: cart.value.items.filter((cartItem) => cartItem.id !== item.id),
    };
    recalculateCartTotals();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    pendingItemIds.value.delete(item.id);
  }
}

function recalculateCartTotals() {
  const items = cart.value.items || [];
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalPrice = items.reduce((sum, item) => sum + Number(item.line_total), 0);

  cart.value = {
    ...cart.value,
    total_items: totalItems,
    subtotal: totalPrice.toFixed(2),
  };
}

function openDrawer() {
  isOpen.value = true;
  loadCart();
}

function closeDrawer() {
  isOpen.value = false;
}

function startCheckout() {
  if (!itemCount.value) {
    return;
  }

  closeDrawer();
  emit("checkout");
}

function isPending(item) {
  return pendingItemIds.value.has(item.id);
}

onMounted(loadCart);
</script>

<template>
  <div>
    <button
      class="fixed bottom-24 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-xl shadow-cyan-950/25 transition hover:-translate-y-0.5 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus:ring-offset-slate-950"
      type="button"
      aria-label="Open cart"
      @click="openDrawer"
    >
      <svg aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M6.5 6.5h15l-2 7h-11z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
        <path
          d="M6.5 6.5 5.8 3H3"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <circle cx="9.5" cy="19" r="1.4" fill="currentColor" />
        <circle cx="18" cy="19" r="1.4" fill="currentColor" />
      </svg>

      <span
        v-if="itemCount"
        class="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 text-xs font-black text-slate-950"
      >
        {{ itemCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm"
      aria-hidden="true"
      @click="closeDrawer"
    />

    <aside
      v-if="isOpen"
      class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md transform flex-col bg-white text-neutral-950 shadow-2xl shadow-cyan-950/20 transition-transform duration-200 dark:bg-slate-950 dark:text-slate-100"
      aria-label="Shopping cart"
    >
      <header
        class="flex items-center justify-between border-b border-cyan-100 bg-cyan-50/70 px-5 py-4 dark:border-cyan-400/10 dark:bg-slate-900"
      >
        <div>
          <h2 class="text-lg font-black text-neutral-950 dark:text-white">Cart</h2>
          <p class="text-sm text-neutral-500 dark:text-slate-400">{{ itemCount }} items</p>
        </div>

        <button
          class="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white dark:focus:ring-slate-700"
          type="button"
          aria-label="Close cart"
          @click="closeDrawer"
        >
          <svg aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>

      <div
        v-if="errorMessage"
        class="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      >
        {{ errorMessage }}
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4">
        <div v-if="isLoading" class="space-y-3">
          <div
            v-for="index in 3"
            :key="index"
            class="h-24 animate-pulse rounded-md bg-neutral-100 dark:bg-slate-800"
          />
        </div>

        <div
          v-else-if="!cart.items.length"
          class="flex h-full items-center justify-center text-center"
        >
          <div>
            <p class="text-base font-medium text-neutral-950 dark:text-white">Your cart is empty</p>
            <p class="mt-1 text-sm text-neutral-500 dark:text-slate-400">
              Add tech products to see them here.
            </p>
          </div>
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="item in cart.items"
            :key="item.id"
            class="rounded-2xl border border-cyan-100 bg-white p-3 shadow-sm shadow-cyan-950/5 dark:border-cyan-400/10 dark:bg-slate-900"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                  {{ item.product_name || `Variant #${item.product_variant_id}` }}
                </h3>
                <p
                  v-if="item.variant_label"
                  class="mt-0.5 truncate text-xs text-neutral-500 dark:text-slate-400"
                >
                  {{ item.variant_label }}
                </p>
                <p class="mt-2 text-sm font-medium text-neutral-900 dark:text-slate-200">
                  ${{ Number(item.unit_price).toFixed(2) }}
                </p>
              </div>

              <button
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-300 dark:focus:ring-red-900"
                type="button"
                aria-label="Remove item"
                :disabled="isPending(item)"
                @click="removeItem(item)"
              >
                <svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3">
              <div
                class="grid h-10 grid-cols-[40px_48px_40px] overflow-hidden rounded-md border border-neutral-300 dark:border-slate-700"
              >
                <button
                  class="flex items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
                  type="button"
                  aria-label="Decrease quantity"
                  :disabled="item.quantity <= 1 || isPending(item)"
                  @click="updateQuantity(item, item.quantity - 1)"
                >
                  -
                </button>
                <output
                  class="flex items-center justify-center border-x border-neutral-300 text-sm font-semibold text-neutral-950 dark:border-slate-700 dark:text-white"
                >
                  {{ item.quantity }}
                </output>
                <button
                  class="flex items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
                  type="button"
                  aria-label="Increase quantity"
                  :disabled="isPending(item)"
                  @click="updateQuantity(item, item.quantity + 1)"
                >
                  +
                </button>
              </div>

              <p class="text-sm font-semibold text-neutral-950 dark:text-white">
                ${{ Number(item.line_total).toFixed(2) }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <footer
        class="border-t border-cyan-100 bg-slate-50/80 p-5 dark:border-cyan-400/10 dark:bg-slate-900"
      >
        <div
          class="flex items-center justify-between text-base font-semibold text-neutral-950 dark:text-white"
        >
          <span>Subtotal</span>
          <span>${{ subtotal }}</span>
        </div>
        <button
          class="mt-4 h-11 w-full rounded-xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          type="button"
          :disabled="!itemCount"
          @click="startCheckout"
        >
          Checkout
        </button>
      </footer>
    </aside>
  </div>
</template>
