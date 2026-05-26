<script setup>
import { computed, onMounted, ref } from "vue";

const emit = defineEmits(["view-order"]);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const statusTabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const orders = ref([]);
const activeStatus = ref("all");
const isLoading = ref(false);
const errorMessage = ref("");

const filteredOrders = computed(() => {
  if (activeStatus.value === "all") {
    return orders.value;
  }

  return orders.value.filter((order) => order.status === activeStatus.value);
});

const orderCountByStatus = computed(() => {
  const counts = {
    all: orders.value.length,
  };

  for (const order of orders.value) {
    counts[order.status] = (counts[order.status] || 0) + 1;
  }

  return counts;
});

function authHeaders() {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadOrders() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(formatApiError(data));
    }

    orders.value = Array.isArray(data) ? data : [];
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

function setStatus(status) {
  activeStatus.value = status;
}

function formatApiError(data) {
  return data.detail || "Orders could not be loaded.";
}

function formatDate(value) {
  if (!value) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusLabel(status) {
  return statusTabs.find((tab) => tab.id === status)?.label || status;
}

function statusClasses(status) {
  const classes = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    confirmed: "border-sky-200 bg-sky-50 text-sky-800",
    processing: "border-indigo-200 bg-indigo-50 text-indigo-800",
    shipped: "border-cyan-200 bg-cyan-50 text-cyan-800",
    delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
    cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  return classes[status] || "border-neutral-200 bg-neutral-100 text-neutral-700";
}

onMounted(loadOrders);
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 py-8" aria-labelledby="orders-title">
    <div
      class="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p class="text-sm font-semibold uppercase text-emerald-700">Order history</p>
        <h1 id="orders-title" class="mt-2 text-3xl font-bold text-neutral-950">Your orders</h1>
      </div>

      <button
        class="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="isLoading"
        @click="loadOrders"
      >
        Refresh
      </button>
    </div>

    <div class="overflow-x-auto" aria-label="Order status filters">
      <div class="flex min-w-max gap-2">
        <button
          v-for="tab in statusTabs"
          :key="tab.id"
          class="flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition"
          :class="
            activeStatus === tab.id
              ? 'border-neutral-950 bg-neutral-950 text-white'
              : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950'
          "
          type="button"
          @click="setStatus(tab.id)"
        >
          <span>{{ tab.label }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs"
            :class="
              activeStatus === tab.id ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-500'
            "
          >
            {{ orderCountByStatus[tab.id] || 0 }}
          </span>
        </button>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="mt-6 space-y-3">
      <div v-for="index in 4" :key="index" class="h-24 animate-pulse rounded-md bg-neutral-100" />
    </div>

    <div
      v-else-if="!errorMessage && !filteredOrders.length"
      class="mt-8 border-y border-neutral-200 py-12 text-center"
    >
      <p class="text-base font-semibold text-neutral-950">No orders found</p>
      <p class="mt-1 text-sm text-neutral-500">Orders with this status will appear here.</p>
    </div>

    <ul v-else-if="!errorMessage" class="mt-6 space-y-3">
      <li
        v-for="order in filteredOrders"
        :key="order.id"
        class="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base font-semibold text-neutral-950">
                {{ order.order_number }}
              </h2>
              <span
                class="rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="statusClasses(order.status)"
              >
                {{ statusLabel(order.status) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-neutral-500">Placed {{ formatDate(order.created_at) }}</p>
          </div>

          <dl class="grid grid-cols-2 gap-4 text-sm sm:min-w-64">
            <div>
              <dt class="text-neutral-500">Subtotal</dt>
              <dd class="mt-1 font-semibold text-neutral-950">
                {{ formatMoney(order.subtotal) }}
              </dd>
            </div>
            <div>
              <dt class="text-neutral-500">Total</dt>
              <dd class="mt-1 font-semibold text-neutral-950">
                {{ formatMoney(order.total_amount) }}
              </dd>
            </div>
          </dl>

          <button
            class="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            type="button"
            @click="emit('view-order', order.order_number)"
          >
            View details
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
