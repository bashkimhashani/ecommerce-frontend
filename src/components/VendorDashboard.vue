<script setup>
import { Chart, ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AIInsightsPanel from './AIInsightsPanel.vue'
import AnalyticsChat from './AnalyticsChat.vue'

Chart.register(ArcElement, DoughnutController, Legend, Tooltip)

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const authToken = ref('')
const summary = ref({
  order_count: 0,
  revenue: 0,
  low_stock_alerts: 0,
})
const inventoryItems = ref([])
const orderSummaryItems = ref([])
const quantityDrafts = reactive({})
const isLoadingSummary = ref(false)
const isLoadingInventory = ref(false)
const isLoadingOrderSummary = ref(false)
const summaryError = ref('')
const inventoryError = ref('')
const orderSummaryError = ref('')
const savedItemId = ref(null)
const savingItemId = ref(null)
const aiRefreshKey = ref(0)
const orderChartCanvas = ref(null)
let orderChart = null

const summaryCards = computed(() => [
  {
    label: 'Orders',
    value: formatNumber(readSummaryValue(['order_count', 'orders_count', 'total_orders'])),
    tone: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    label: 'Revenue',
    value: formatCurrency(readSummaryValue(['revenue', 'total_revenue', 'gross_revenue'])),
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  {
    label: 'Low stock',
    value: formatNumber(readLowStockCount()),
    tone: readLowStockCount() > 0
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-slate-50 text-slate-700',
  },
])

const hasInventory = computed(() => inventoryItems.value.length > 0)
const hasOrderSummary = computed(() => orderSummaryItems.value.length > 0)
const orderSummaryTotal = computed(() => (
  orderSummaryItems.value.reduce((total, item) => total + Number(item.count || 0), 0)
))
const orderSummaryRevenue = computed(() => (
  orderSummaryItems.value.reduce((total, item) => total + Number(item.total_amount || 0), 0)
))

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}),
  }
}

function readSummaryValue(keys) {
  const source = summary.value || {}
  const key = keys.find((candidate) => source[candidate] !== undefined)
  return Number(source[key] || 0)
}

function readLowStockCount() {
  const value = summary.value?.low_stock_alerts

  if (Array.isArray(value)) {
    return value.length
  }

  return Number(value || summary.value?.low_stock_count || 0)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatStatus(status) {
  return String(status || 'unknown')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function itemQuantity(item) {
  return Number(item.quantity ?? item.quantity_available ?? item.available_quantity ?? 0)
}

function itemThreshold(item) {
  return Number(item.low_stock_threshold ?? 0)
}

function itemProductName(item) {
  return item.product_name || item.product?.name || item.product_variant?.product_name || 'Product'
}

function itemVariantName(item) {
  const variant = item.product_variant || item.variant || {}
  const directName = item.product_variant_name || item.variant_name || variant.name

  if (directName) {
    return directName
  }

  return [variant.color, variant.storage, variant.ram].filter(Boolean).join(' / ') || 'Default'
}

function itemSku(item) {
  return item.sku || item.product_variant?.sku || item.variant?.sku || item.product?.sku || 'Unassigned'
}

function itemLastUpdated(item) {
  const value = item.last_updated || item.updated_at || item.created_at

  if (!value) {
    return 'Not synced'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function isLowStock(item) {
  return itemQuantity(item) < itemThreshold(item)
}

function syncQuantityDrafts(items) {
  items.forEach((item) => {
    quantityDrafts[item.id] = itemQuantity(item)
  })
}

function normalizeInventoryPayload(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.results)) {
    return payload.results
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  if (Array.isArray(payload?.inventory)) {
    return payload.inventory
  }

  return []
}

function normalizeOrderSummaryPayload(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.results)) {
    return payload.results
  }

  if (Array.isArray(payload?.statuses)) {
    return payload.statuses
  }

  if (Array.isArray(payload?.summary)) {
    return payload.summary
  }

  return []
}

function destroyOrderChart() {
  if (!orderChart) {
    return
  }

  orderChart.destroy()
  orderChart = null
}

function renderOrderChart() {
  destroyOrderChart()

  if (!orderChartCanvas.value || !hasOrderSummary.value) {
    return
  }

  orderChart = new Chart(orderChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: orderSummaryItems.value.map((item) => formatStatus(item.status)),
      datasets: [
        {
          data: orderSummaryItems.value.map((item) => Number(item.count || 0)),
          backgroundColor: [
            '#0891b2',
            '#059669',
            '#d97706',
            '#dc2626',
            '#4f46e5',
            '#64748b',
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = Number(context.raw || 0)
              const share = orderSummaryTotal.value
                ? Math.round((value / orderSummaryTotal.value) * 100)
                : 0
              return `${context.label}: ${formatNumber(value)} orders (${share}%)`
            },
          },
        },
      },
    },
  })
}

async function fetchSummary() {
  isLoadingSummary.value = true
  summaryError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vendor/dashboard/summary/`, {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Could not load vendor summary.')
    }

    summary.value = await response.json()
  } catch (error) {
    summaryError.value = error.message || 'Could not load vendor summary.'
  } finally {
    isLoadingSummary.value = false
  }
}

async function fetchInventory() {
  isLoadingInventory.value = true
  inventoryError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vendor/inventory/`, {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Could not load inventory.')
    }

    const payload = await response.json()
    inventoryItems.value = normalizeInventoryPayload(payload)
    syncQuantityDrafts(inventoryItems.value)
  } catch (error) {
    inventoryError.value = error.message || 'Could not load inventory.'
  } finally {
    isLoadingInventory.value = false
  }
}

async function fetchOrderSummary() {
  isLoadingOrderSummary.value = true
  orderSummaryError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vendor/orders/summary/`, {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Could not load order summary.')
    }

    const payload = await response.json()
    orderSummaryItems.value = normalizeOrderSummaryPayload(payload)
    isLoadingOrderSummary.value = false
    await nextTick()
    renderOrderChart()
  } catch (error) {
    orderSummaryItems.value = []
    destroyOrderChart()
    orderSummaryError.value = error.message || 'Could not load order summary.'
    isLoadingOrderSummary.value = false
  }
}

async function refreshDashboard() {
  aiRefreshKey.value += 1
  await Promise.all([
    fetchSummary(),
    fetchInventory(),
    fetchOrderSummary(),
  ])
}

async function saveQuantity(item) {
  const nextQuantity = Number(quantityDrafts[item.id])

  if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
    inventoryError.value = 'Quantity must be zero or greater.'
    return
  }

  savingItemId.value = item.id
  savedItemId.value = null
  inventoryError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vendor/inventory/${item.id}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        quantity: nextQuantity,
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload.detail || 'Could not update quantity.')
    }

    const updatedItem = await response.json()
    inventoryItems.value = inventoryItems.value.map((currentItem) => (
      currentItem.id === item.id ? { ...currentItem, ...updatedItem } : currentItem
    ))
    quantityDrafts[item.id] = itemQuantity(updatedItem)
    savedItemId.value = item.id
    await fetchSummary()
  } catch (error) {
    inventoryError.value = error.message || 'Could not update quantity.'
  } finally {
    savingItemId.value = null
  }
}

onMounted(() => {
  refreshDashboard()
})

onBeforeUnmount(() => {
  destroyOrderChart()
})
</script>

<template>
  <section class="min-w-0 flex-1 px-6 py-5">
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-950">Vendor Dashboard</h1>
        <p class="mt-1 text-sm text-slate-500">Inventory, revenue, and low-stock status.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="authToken"
          type="password"
          placeholder="Bearer token"
          class="h-10 w-52 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-500"
        >
        <button
          type="button"
          class="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
        <p class="mt-2 text-3xl font-semibold tracking-normal">{{ isLoadingSummary ? '...' : card.value }}</p>
      </section>
    </div>

    <p
      v-if="summaryError"
      class="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      {{ summaryError }}
    </p>

    <div class="mb-5 grid gap-4 lg:grid-cols-2">
      <AIInsightsPanel :auth-token="authToken" :refresh-key="aiRefreshKey" />
      <AnalyticsChat :auth-token="authToken" />
    </div>

    <section class="mb-5 rounded-md border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-950">Order Reports</h2>
          <p class="mt-1 text-xs text-slate-500">Status breakdown from vendor order items</p>
        </div>
        <div class="text-right text-xs text-slate-500">
          <p><span class="font-semibold text-slate-950">{{ formatNumber(orderSummaryTotal) }}</span> orders</p>
          <p><span class="font-semibold text-slate-950">{{ formatCurrency(orderSummaryRevenue) }}</span> revenue</p>
        </div>
      </div>

      <div v-if="isLoadingOrderSummary" class="grid gap-4 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div class="h-64 animate-pulse rounded-md bg-slate-50"></div>
        <div class="space-y-3">
          <div v-for="item in 4" :key="item" class="h-12 animate-pulse rounded-md bg-slate-50"></div>
        </div>
      </div>

      <div
        v-else-if="orderSummaryError"
        class="m-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {{ orderSummaryError }}
      </div>

      <div
        v-else-if="!hasOrderSummary"
        class="px-4 py-10 text-center"
      >
        <p class="text-sm font-semibold text-slate-700">No order report data yet.</p>
        <p class="mt-1 text-sm text-slate-500">Status totals will appear after orders are placed.</p>
      </div>

      <div v-else class="grid gap-4 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div class="relative h-64">
          <canvas ref="orderChartCanvas" aria-label="Order status chart"></canvas>
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <p class="text-2xl font-semibold text-slate-950">{{ formatNumber(orderSummaryTotal) }}</p>
              <p class="text-xs font-medium text-slate-500">Orders</p>
            </div>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="item in orderSummaryItems"
            :key="item.status"
            class="grid grid-cols-[minmax(0,1fr)_80px_110px] items-center gap-3 py-3 text-sm"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-950">{{ formatStatus(item.status) }}</p>
              <p class="text-xs text-slate-500">{{ formatCurrency(item.total_amount) }}</p>
            </div>
            <p class="text-right font-semibold text-slate-700">{{ formatNumber(item.count) }}</p>
            <div class="h-2 rounded-full bg-slate-100">
              <div
                class="h-2 rounded-full bg-cyan-600"
                :style="{ width: `${orderSummaryTotal ? Math.max(8, (Number(item.count || 0) / orderSummaryTotal) * 100) : 0}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-md border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-950">Inventory</h2>
          <p class="mt-1 text-xs text-slate-500">{{ inventoryItems.length }} variants tracked</p>
        </div>
      </div>

      <div v-if="isLoadingInventory" class="space-y-3 p-4">
        <div
          v-for="item in 5"
          :key="item"
          class="h-16 animate-pulse rounded-md bg-slate-50"
        ></div>
      </div>

      <div
        v-else-if="inventoryError"
        class="m-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ inventoryError }}
      </div>

      <div
        v-else-if="!hasInventory"
        class="px-4 py-12 text-center"
      >
        <p class="text-sm font-semibold text-slate-700">No inventory items found.</p>
        <p class="mt-1 text-sm text-slate-500">Tracked product variants will appear here.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
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
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in inventoryItems"
              :key="item.id"
              class="hover:bg-slate-50"
            >
              <td class="px-4 py-3 font-medium text-slate-950">{{ itemProductName(item) }}</td>
              <td class="px-4 py-3 text-slate-600">{{ itemVariantName(item) }}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ itemSku(item) }}</td>
              <td class="px-4 py-3">
                <input
                  v-model.number="quantityDrafts[item.id]"
                  type="number"
                  min="0"
                  class="h-9 w-24 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-500"
                >
              </td>
              <td class="px-4 py-3 text-slate-600">{{ itemThreshold(item) }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex min-w-24 justify-center rounded-md border px-2.5 py-1 text-xs font-semibold"
                  :class="isLowStock(item) ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
                >
                  {{ isLowStock(item) ? 'Low stock' : 'In stock' }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-500">{{ itemLastUpdated(item) }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  :disabled="savingItemId === item.id || Number(quantityDrafts[item.id]) === itemQuantity(item)"
                  @click="saveQuantity(item)"
                >
                  {{ savingItemId === item.id ? 'Saving' : savedItemId === item.id ? 'Saved' : 'Save' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
