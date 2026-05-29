<script setup>
import { Chart, ArcElement, DoughnutController, Legend, Tooltip } from "chart.js";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useAuthStore } from "../stores/authStore";

Chart.register(ArcElement, DoughnutController, Legend, Tooltip);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const authStore = useAuthStore();
const summary = ref({
  order_count: 0,
  revenue: 0,
  low_stock_alerts: 0,
});
const inventoryItems = ref([]);
const orderSummaryItems = ref([]);
const quantityDrafts = reactive({});
const productForm = reactive({
  name: "",
  sku: "",
  price: "",
  brandName: "",
  categoryName: "General",
  stockQuantity: 0,
});
const productImageFile = ref(null);
const productImagePreviewUrl = ref("");
const productImageInput = ref(null);
const isLoadingSummary = ref(false);
const isLoadingInventory = ref(false);
const isLoadingOrderSummary = ref(false);
const summaryError = ref("");
const inventoryError = ref("");
const orderSummaryError = ref("");
const savedItemId = ref(null);
const savingItemId = ref(null);
const isCreatingProduct = ref(false);
const productMessage = ref("");
const orderChartCanvas = ref(null);
let orderChart = null;

const summaryCards = computed(() => [
  {
    label: "Orders",
    value: formatNumber(readSummaryValue(["order_count", "orders_count", "total_orders"])),
    tone: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
  },
  {
    label: "Revenue",
    value: formatCurrency(readSummaryValue(["revenue", "total_revenue", "gross_revenue"])),
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
  {
    label: "Low stock",
    value: formatNumber(readLowStockCount()),
    tone:
      readLowStockCount() > 0
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
]);

const hasInventory = computed(() => inventoryItems.value.length > 0);
const hasOrderSummary = computed(() => orderSummaryItems.value.length > 0);
const orderSummaryTotal = computed(() =>
  orderSummaryItems.value.reduce((total, item) => total + Number(item.count || 0), 0)
);
const orderSummaryRevenue = computed(() =>
  orderSummaryItems.value.reduce((total, item) => total + Number(item.total_amount || 0), 0)
);
const productPreviewVendor = computed(
  () => productForm.brandName.trim() || authStore.user?.first_name || "Vendor"
);
const productPreviewPrice = computed(() => formatCurrency(productForm.price || 0));

function authHeaders() {
  return {
    "Content-Type": "application/json",
    ...(authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {}),
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clearProductImagePreview() {
  if (productImagePreviewUrl.value) {
    URL.revokeObjectURL(productImagePreviewUrl.value);
    productImagePreviewUrl.value = "";
  }
}

function chooseProductImage() {
  productImageInput.value?.click();
}

function handleProductImageChange(event) {
  const [file] = event.target.files || [];
  clearProductImagePreview();
  productImageFile.value = null;

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    inventoryError.value = "Choose an image file for the product.";
    event.target.value = "";
    return;
  }

  productImageFile.value = file;
  productImagePreviewUrl.value = URL.createObjectURL(file);
}

function readSummaryValue(keys) {
  const source = summary.value || {};
  const key = keys.find((candidate) => source[candidate] !== undefined);
  return Number(source[key] || 0);
}

function readLowStockCount() {
  const value = summary.value?.low_stock_alerts;

  if (Array.isArray(value)) {
    return value.length;
  }

  return Number(value || summary.value?.low_stock_count || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatStatus(status) {
  return String(status || "unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function itemQuantity(item) {
  return Number(item.quantity ?? item.quantity_available ?? item.available_quantity ?? 0);
}

function itemThreshold(item) {
  return Number(item.low_stock_threshold ?? 0);
}

function itemProductName(item) {
  return item.product_name || item.product?.name || item.product_variant?.product_name || "Product";
}

function itemVariantName(item) {
  const variant = item.product_variant || item.variant || {};
  const directName = item.product_variant_name || item.variant_name || variant.name;

  if (directName) {
    return directName;
  }

  return [variant.color, variant.storage, variant.ram].filter(Boolean).join(" / ") || "Default";
}

function itemSku(item) {
  return (
    item.sku || item.product_variant?.sku || item.variant?.sku || item.product?.sku || "Unassigned"
  );
}

function itemLastUpdated(item) {
  const value = item.last_updated || item.updated_at || item.created_at;

  if (!value) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isLowStock(item) {
  return itemQuantity(item) < itemThreshold(item);
}

function syncQuantityDrafts(items) {
  items.forEach((item) => {
    quantityDrafts[item.id] = itemQuantity(item);
  });
}

function normalizeInventoryPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.inventory)) {
    return payload.inventory;
  }

  return [];
}

function normalizeOrderSummaryPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.statuses)) {
    return payload.statuses;
  }

  if (Array.isArray(payload?.summary)) {
    return payload.summary;
  }

  return [];
}

function destroyOrderChart() {
  if (!orderChart) {
    return;
  }

  orderChart.destroy();
  orderChart = null;
}

function renderOrderChart() {
  destroyOrderChart();

  if (!orderChartCanvas.value || !hasOrderSummary.value) {
    return;
  }

  orderChart = new Chart(orderChartCanvas.value, {
    type: "doughnut",
    data: {
      labels: orderSummaryItems.value.map((item) => formatStatus(item.status)),
      datasets: [
        {
          data: orderSummaryItems.value.map((item) => Number(item.count || 0)),
          backgroundColor: ["#0891b2", "#059669", "#d97706", "#dc2626", "#4f46e5", "#64748b"],
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = Number(context.raw || 0);
              const share = orderSummaryTotal.value
                ? Math.round((value / orderSummaryTotal.value) * 100)
                : 0;
              return `${context.label}: ${formatNumber(value)} orders (${share}%)`;
            },
          },
        },
      },
    },
  });
}

async function fetchSummary() {
  isLoadingSummary.value = true;
  summaryError.value = "";

  try {
    const response = await authStore.authenticatedFetch(
      `${apiBaseUrl}/api/v1/vendor/dashboard/summary/`
    );

    if (!response.ok) {
      throw new Error("Could not load vendor summary.");
    }

    summary.value = await response.json();
  } catch (error) {
    summaryError.value = error.message || "Could not load vendor summary.";
  } finally {
    isLoadingSummary.value = false;
  }
}

async function fetchInventory() {
  isLoadingInventory.value = true;
  inventoryError.value = "";

  try {
    const response = await authStore.authenticatedFetch(`${apiBaseUrl}/api/v1/vendor/inventory/`);

    if (!response.ok) {
      throw new Error("Could not load inventory.");
    }

    const payload = await response.json();
    inventoryItems.value = normalizeInventoryPayload(payload);
    syncQuantityDrafts(inventoryItems.value);
  } catch (error) {
    inventoryError.value = error.message || "Could not load inventory.";
  } finally {
    isLoadingInventory.value = false;
  }
}

async function fetchOrderSummary() {
  isLoadingOrderSummary.value = true;
  orderSummaryError.value = "";

  try {
    const response = await authStore.authenticatedFetch(
      `${apiBaseUrl}/api/v1/vendor/orders/summary/`
    );

    if (!response.ok) {
      throw new Error("Could not load order summary.");
    }

    const payload = await response.json();
    orderSummaryItems.value = normalizeOrderSummaryPayload(payload);
    isLoadingOrderSummary.value = false;
    await nextTick();
    renderOrderChart();
  } catch (error) {
    orderSummaryItems.value = [];
    destroyOrderChart();
    orderSummaryError.value = error.message || "Could not load order summary.";
    isLoadingOrderSummary.value = false;
  }
}

async function refreshDashboard() {
  await Promise.all([fetchSummary(), fetchInventory(), fetchOrderSummary()]);
}

async function saveQuantity(item) {
  const nextQuantity = Number(quantityDrafts[item.id]);

  if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
    inventoryError.value = "Quantity must be zero or greater.";
    return;
  }

  savingItemId.value = item.id;
  savedItemId.value = null;
  inventoryError.value = "";

  try {
    const response = await authStore.authenticatedFetch(`${apiBaseUrl}/api/v1/vendor/inventory/${item.id}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        quantity: nextQuantity,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || "Could not update quantity.");
    }

    const updatedItem = await response.json();
    inventoryItems.value = inventoryItems.value.map((currentItem) =>
      currentItem.id === item.id ? { ...currentItem, ...updatedItem } : currentItem
    );
    quantityDrafts[item.id] = itemQuantity(updatedItem);
    savedItemId.value = item.id;
    await fetchSummary();
  } catch (error) {
    inventoryError.value = error.message || "Could not update quantity.";
  } finally {
    savingItemId.value = null;
  }
}

async function createProduct() {
  productMessage.value = "";

  if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.price) {
    inventoryError.value = "Product name, SKU, and price are required.";
    return;
  }

  isCreatingProduct.value = true;
  inventoryError.value = "";

  try {
    const response = await authStore.authenticatedFetch(`${apiBaseUrl}/api/v1/catalog/products/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: productForm.name.trim(),
        slug: slugify(productForm.name),
        sku: productForm.sku.trim(),
        status: "active",
        base_price: productForm.price,
        brand_name: productForm.brandName.trim() || authStore.user?.first_name || "Vendor",
        category_name: productForm.categoryName.trim() || "General",
        stock_quantity: Number(productForm.stockQuantity || 0),
        tech_specs: {},
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.detail || payload?.non_field_errors?.[0] || "Could not create product.");
    }

    if (productImageFile.value) {
      const imageData = new FormData();
      imageData.append("image", productImageFile.value);
      imageData.append("alt_text", productForm.name.trim());
      imageData.append("sort_order", "0");
      imageData.append("is_primary", "true");

      const imageResponse = await authStore.authenticatedFetch(
        `${apiBaseUrl}/api/v1/catalog/products/${payload.slug}/images/`,
        {
          method: "POST",
          body: imageData,
        }
      );

      if (!imageResponse.ok) {
        const imagePayload = await imageResponse.json().catch(() => ({}));
        throw new Error(
          imagePayload?.detail || imagePayload?.image?.[0] || "Product created, but image upload failed."
        );
      }
    }

    resetProductForm();
    productMessage.value = "Product created inside your tenant.";
    window.dispatchEvent(new CustomEvent("catalog-search-change"));
    await refreshDashboard();
  } catch (error) {
    inventoryError.value = error.message || "Could not create product.";
  } finally {
    isCreatingProduct.value = false;
  }
}

function resetProductForm() {
  productForm.name = "";
  productForm.sku = "";
  productForm.price = "";
  productForm.brandName = "";
  productForm.categoryName = "General";
  productForm.stockQuantity = 0;
  productImageFile.value = null;
  clearProductImagePreview();
  if (productImageInput.value) {
    productImageInput.value.value = "";
  }
}

onMounted(() => {
  refreshDashboard();
});

onBeforeUnmount(() => {
  destroyOrderChart();
  clearProductImagePreview();
});
</script>

<template>
  <section
    class="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white px-6 py-5 text-slate-950 dark:bg-slate-950 dark:text-slate-100"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-950 dark:text-white">Vendor Dashboard</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Inventory, revenue, and low-stock status.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          :disabled="isLoadingSummary || isLoadingInventory || isLoadingOrderSummary"
          @click="refreshDashboard"
        >
          Refresh
        </button>
      </div>
    </div>

    <div class="grid gap-4 py-5 md:grid-cols-3">
      <section
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-md border p-4"
        :class="card.tone"
      >
        <p class="text-sm font-medium">{{ card.label }}</p>
        <p class="mt-2 text-3xl font-semibold tracking-normal">
          {{ isLoadingSummary ? "..." : card.value }}
        </p>
      </section>
    </div>

    <p
      v-if="summaryError"
      class="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      {{ summaryError }}
    </p>

    <section
      class="mb-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <h2 class="text-base font-black text-slate-950 dark:text-white">Add product</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Products created here are saved only inside your vendor tenant.
          </p>
        </div>
        <p v-if="productMessage" class="text-sm font-bold text-emerald-600 dark:text-emerald-300">
          {{ productMessage }}
        </p>
      </div>

      <form class="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]" @submit.prevent="createProduct">
        <div class="grid gap-4">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Product name
              <input
                v-model="productForm.name"
                class="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                type="text"
                placeholder="Apple MacBook Air"
              />
            </label>
            <label class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              SKU
              <input
                v-model="productForm.sku"
                class="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                type="text"
                placeholder="MBA-13-M3"
              />
            </label>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <label class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Price
              <input
                v-model="productForm.price"
                class="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                type="number"
                min="0"
                step="0.01"
                placeholder="1099"
              />
            </label>
            <label class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Stock
              <input
                v-model.number="productForm.stockQuantity"
                class="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                type="number"
                min="0"
                placeholder="12"
              />
            </label>
            <label class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Category
              <input
                v-model="productForm.categoryName"
                class="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                type="text"
                placeholder="Laptops"
              />
            </label>
          </div>

          <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <label class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Brand
              <input
                v-model="productForm.brandName"
                class="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                type="text"
                placeholder="Brand"
              />
            </label>
            <div>
              <input
                ref="productImageInput"
                class="sr-only"
                type="file"
                accept="image/*"
                @change="handleProductImageChange"
              />
              <button
                type="button"
                class="mt-5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                @click="chooseProductImage"
              >
                Upload image
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-black text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-cyan-300 dark:text-slate-950"
            :disabled="isCreatingProduct"
          >
            {{ isCreatingProduct ? "Adding product..." : "Add product" }}
          </button>
        </div>

        <article
          class="grid min-h-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <div class="relative flex min-h-40 items-center justify-center bg-slate-50 p-4 dark:bg-slate-800">
            <img
              v-if="productImagePreviewUrl"
              :src="productImagePreviewUrl"
              alt=""
              class="max-h-44 max-w-full object-contain"
            />
            <div v-else class="text-center text-sm font-bold text-slate-400 dark:text-slate-500">
              Product image preview
            </div>
          </div>
          <div class="p-4">
            <p class="line-clamp-2 text-base font-black text-slate-950 dark:text-white">
              {{ productForm.name || "Product name" }}
            </p>
            <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {{ productForm.sku || "SKU" }}
            </p>
            <p
              class="mt-3 inline-flex max-w-full rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-200"
            >
              <span class="truncate">{{ productPreviewVendor }}</span>
            </p>
            <div class="mt-4 flex items-center justify-between gap-3">
              <p class="text-lg font-black text-emerald-600 dark:text-emerald-300">
                {{ productPreviewPrice }}
              </p>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
                {{ Number(productForm.stockQuantity || 0) }} stock
              </p>
            </div>
          </div>
        </article>
      </form>
    </section>

    <section
      class="mb-5 rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700"
      >
        <div>
          <h2 class="text-sm font-semibold text-slate-950 dark:text-white">Order Reports</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Status breakdown from vendor order items
          </p>
        </div>
        <div class="text-right text-xs text-slate-500 dark:text-slate-400">
          <p>
            <span class="font-semibold text-slate-950 dark:text-white">{{
              formatNumber(orderSummaryTotal)
            }}</span>
            orders
          </p>
          <p>
            <span class="font-semibold text-slate-950 dark:text-white">{{
              formatCurrency(orderSummaryRevenue)
            }}</span>
            revenue
          </p>
        </div>
      </div>

      <div v-if="isLoadingOrderSummary" class="grid gap-4 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div class="h-64 animate-pulse rounded-md bg-slate-50 dark:bg-slate-800"></div>
        <div class="space-y-3">
          <div
            v-for="item in 4"
            :key="item"
            class="h-12 animate-pulse rounded-md bg-slate-50 dark:bg-slate-800"
          ></div>
        </div>
      </div>

      <div
        v-else-if="orderSummaryError"
        class="m-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      >
        {{ orderSummaryError }}
      </div>

      <div v-else-if="!hasOrderSummary" class="px-4 py-10 text-center">
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">
          No order report data yet.
        </p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Status totals will appear after orders are placed.
        </p>
      </div>

      <div v-else class="grid gap-4 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div class="relative h-64">
          <canvas ref="orderChartCanvas" aria-label="Order status chart"></canvas>
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <p class="text-2xl font-semibold text-slate-950 dark:text-white">
                {{ formatNumber(orderSummaryTotal) }}
              </p>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Orders</p>
            </div>
          </div>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <div
            v-for="item in orderSummaryItems"
            :key="item.status"
            class="grid grid-cols-[minmax(0,1fr)_80px_110px] items-center gap-3 py-3 text-sm"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-950 dark:text-slate-100">
                {{ formatStatus(item.status) }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ formatCurrency(item.total_amount) }}
              </p>
            </div>
            <p class="text-right font-semibold text-slate-700 dark:text-slate-200">
              {{ formatNumber(item.count) }}
            </p>
            <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-2 rounded-full bg-cyan-600"
                :style="{
                  width: `${orderSummaryTotal ? Math.max(8, (Number(item.count || 0) / orderSummaryTotal) * 100) : 0}%`,
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      class="rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700"
      >
        <div>
          <h2 class="text-sm font-semibold text-slate-950 dark:text-white">Inventory</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {{ inventoryItems.length }} variants tracked
          </p>
        </div>
      </div>

      <div v-if="isLoadingInventory" class="space-y-3 p-4">
        <div
          v-for="item in 5"
          :key="item"
          class="h-16 animate-pulse rounded-md bg-slate-50 dark:bg-slate-800"
        ></div>
      </div>

      <div
        v-else-if="inventoryError"
        class="m-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      >
        {{ inventoryError }}
      </div>

      <div v-else-if="!hasInventory" class="px-4 py-12 text-center">
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">
          No inventory items found.
        </p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tracked product variants will appear here.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
          <thead
            class="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            <tr>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Variant</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Quantity</th>
              <th class="px-4 py-3">Threshold</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Updated</th>
              <th class="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="item in inventoryItems"
              :key="item.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/70"
            >
              <td class="px-4 py-3 font-medium text-slate-950 dark:text-slate-100">
                {{ itemProductName(item) }}
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                {{ itemVariantName(item) }}
              </td>
              <td class="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                {{ itemSku(item) }}
              </td>
              <td class="px-4 py-3">
                <input
                  v-model.number="quantityDrafts[item.id]"
                  type="number"
                  min="0"
                  class="h-9 w-24 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                />
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                {{ itemThreshold(item) }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex min-w-24 justify-center rounded-md border px-2.5 py-1 text-xs font-semibold"
                  :class="
                    isLowStock(item)
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  "
                >
                  {{ isLowStock(item) ? "Low stock" : "In stock" }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                {{ itemLastUpdated(item) }}
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                  :disabled="
                    savingItemId === item.id ||
                    Number(quantityDrafts[item.id]) === itemQuantity(item)
                  "
                  @click="saveQuantity(item)"
                >
                  {{
                    savingItemId === item.id ? "Saving" : savedItemId === item.id ? "Saved" : "Save"
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
