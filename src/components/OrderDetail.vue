<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({
  orderNumber: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["back"]);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const lifecycleSteps = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

const order = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");

const timelineSteps = computed(() => {
  if (order.value?.status === "cancelled") {
    return [
      { id: "pending", label: "Pending" },
      { id: "cancelled", label: "Cancelled" },
    ];
  }

  return lifecycleSteps;
});

const eventLog = computed(() => {
  const apiEvents = Array.isArray(order.value?.events) ? order.value.events : [];
  if (apiEvents.length) {
    return apiEvents.map((event) => ({
      id: event.id || `${event.transition}-${event.created_at}`,
      title: event.transition
        ? formatTransition(event.transition)
        : `Status updated to ${statusLabel(event.to_status)}`,
      description: event.from_status
        ? `${statusLabel(event.from_status)} to ${statusLabel(event.to_status)}`
        : statusLabel(event.to_status),
      created_at: event.created_at,
    }));
  }

  if (!order.value) {
    return [];
  }

  const fallbackEvents = [
    {
      id: "created",
      title: "Order placed",
      description: `Initial status: ${statusLabel("pending")}`,
      created_at: order.value.created_at,
    },
  ];

  if (order.value.status && order.value.status !== "pending") {
    fallbackEvents.push({
      id: "current-status",
      title: `Status is ${statusLabel(order.value.status)}`,
      description: "Latest status from the order record",
      created_at: order.value.updated_at || order.value.created_at,
    });
  }

  return fallbackEvents;
});

function authHeaders() {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadOrder() {
  if (!props.orderNumber) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/${props.orderNumber}/`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || "Order could not be loaded.");
    }

    order.value = data;
  } catch (error) {
    order.value = null;
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

function timelineState(stepId) {
  if (!order.value?.status) {
    return "upcoming";
  }

  if (order.value.status === "cancelled") {
    return stepId === "cancelled" ? "current-cancelled" : "complete";
  }

  const currentIndex = lifecycleSteps.findIndex((step) => step.id === order.value.status);
  const stepIndex = lifecycleSteps.findIndex((step) => step.id === stepId);

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function markerClasses(state) {
  const classes = {
    complete: "border-emerald-600 bg-emerald-600 text-white",
    current: "border-neutral-950 bg-neutral-950 text-white",
    "current-cancelled": "border-red-600 bg-red-600 text-white",
    upcoming: "border-neutral-300 bg-white text-neutral-400",
  };

  return classes[state];
}

function labelClasses(state) {
  const classes = {
    complete: "text-emerald-800",
    current: "text-neutral-950",
    "current-cancelled": "text-red-700",
    upcoming: "text-neutral-500",
  };

  return classes[state];
}

function statusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status] || status || "Unknown";
}

function statusBadgeClasses(status) {
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

function formatTransition(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function addressLine(address) {
  if (!address || typeof address !== "object") {
    return "Address pending";
  }

  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

watch(() => props.orderNumber, loadOrder);
onMounted(loadOrder);
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 py-8" aria-labelledby="order-detail-title">
    <div
      class="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <button
          class="mb-3 text-sm font-semibold text-neutral-600 transition hover:text-neutral-950"
          type="button"
          @click="emit('back')"
        >
          Back to orders
        </button>
        <p class="text-sm font-semibold uppercase text-emerald-700">Order detail</p>
        <h1 id="order-detail-title" class="mt-2 text-3xl font-bold text-neutral-950">
          {{ props.orderNumber }}
        </h1>
      </div>

      <button
        class="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="isLoading"
        @click="loadOrder"
      >
        Refresh
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="h-80 animate-pulse rounded-md bg-neutral-100" />
      <div class="h-80 animate-pulse rounded-md bg-neutral-100" />
    </div>

    <div v-else-if="order" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-6">
        <section
          class="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
          aria-labelledby="timeline-title"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="timeline-title" class="text-lg font-semibold text-neutral-950">
              Status timeline
            </h2>
            <span
              class="w-fit rounded-full border px-2.5 py-1 text-xs font-semibold"
              :class="statusBadgeClasses(order.status)"
            >
              {{ statusLabel(order.status) }}
            </span>
          </div>

          <ol class="mt-6 grid gap-4 sm:grid-cols-5">
            <li
              v-for="(step, index) in timelineSteps"
              :key="step.id"
              class="relative flex gap-3 sm:block"
            >
              <div
                v-if="index < timelineSteps.length - 1"
                class="absolute left-4 top-9 h-[calc(100%+1rem)] w-px bg-neutral-200 sm:left-8 sm:top-4 sm:h-px sm:w-[calc(100%+1rem)]"
                aria-hidden="true"
              />
              <div
                class="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold"
                :class="markerClasses(timelineState(step.id))"
              >
                {{ index + 1 }}
              </div>
              <p
                class="mt-1 text-sm font-semibold sm:mt-3"
                :class="labelClasses(timelineState(step.id))"
              >
                {{ step.label }}
              </p>
            </li>
          </ol>
        </section>

        <section
          class="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
          aria-labelledby="event-log-title"
        >
          <h2 id="event-log-title" class="text-lg font-semibold text-neutral-950">Event log</h2>

          <ol class="mt-5 space-y-4">
            <li
              v-for="event in eventLog"
              :key="event.id"
              class="border-l-2 border-neutral-200 pl-4"
            >
              <p class="text-sm font-semibold text-neutral-950">
                {{ event.title }}
              </p>
              <p class="mt-1 text-sm text-neutral-500">
                {{ event.description }}
              </p>
              <time class="mt-2 block text-xs font-medium text-neutral-400">
                {{ formatDateTime(event.created_at) }}
              </time>
            </li>
          </ol>
        </section>
      </div>

      <aside
        class="self-start rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
        aria-label="Order summary"
      >
        <h2 class="text-lg font-semibold text-neutral-950">Summary</h2>

        <dl class="mt-5 space-y-4 text-sm">
          <div class="border-b border-neutral-100 pb-4">
            <dt class="text-neutral-500">Placed</dt>
            <dd class="mt-1 font-semibold text-neutral-950">
              {{ formatDateTime(order.created_at) }}
            </dd>
          </div>
          <div class="border-b border-neutral-100 pb-4">
            <dt class="text-neutral-500">Shipping address</dt>
            <dd class="mt-1 leading-6 text-neutral-950">
              {{ addressLine(order.shipping_address) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-neutral-100 pb-4">
            <dt class="text-neutral-500">Subtotal</dt>
            <dd class="font-semibold text-neutral-950">
              {{ formatMoney(order.subtotal) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-base">
            <dt class="font-semibold text-neutral-950">Total</dt>
            <dd class="font-bold text-neutral-950">
              {{ formatMoney(order.total_amount) }}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  </section>
</template>
