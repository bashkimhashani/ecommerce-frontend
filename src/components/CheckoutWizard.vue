<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const emit = defineEmits(['close'])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const STEP_KEY = 'vendora.checkout.step'
const ADDRESS_KEY = 'vendora.checkout.address'
const IDEMPOTENCY_KEY = 'vendora.checkout.idempotencyKey'
const SESSION_KEY = 'vendora.checkout.session'
const PAYMENT_KEY = 'vendora.checkout.payment'
const HISTORY_NAMESPACE = 'vendora.checkout'

const steps = [
  { id: 'address', label: 'Address' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
]

const currentStep = ref(readStoredStep())
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const cart = ref({
  items: [],
  total_items: 0,
  subtotal: '0.00',
})
const checkoutSession = ref(readJson(SESSION_KEY, null))
const paymentSummary = ref(readJson(PAYMENT_KEY, null))

const address = reactive({
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  ...readJson(ADDRESS_KEY, {}),
})

const payment = reactive({
  cardholder: '',
  card_number: '',
  expiry: '',
  cvc: '',
})
let isApplyingHistoryStep = false

const activeStepIndex = computed(() => (
  Math.max(0, steps.findIndex((step) => step.id === currentStep.value))
))
const subtotal = computed(() => Number(cart.value?.subtotal || 0).toFixed(2))
const shippingEstimate = computed(() => (Number(subtotal.value) > 0 ? 6.99 : 0))
const total = computed(() => (Number(subtotal.value) + shippingEstimate.value).toFixed(2))
const maskedCard = computed(() => (
  paymentSummary.value?.last4 ? `Card ending in ${paymentSummary.value.last4}` : 'Payment details pending'
))
const canSubmitPayment = computed(() => (
  payment.cardholder.trim()
  && digitsOnly(payment.card_number).length >= 12
  && /^\d{2}\/\d{2}$/.test(payment.expiry.trim())
  && digitsOnly(payment.cvc).length >= 3
))

watch(currentStep, (step) => {
  persistWizardStep(step)

  if (!isApplyingHistoryStep) {
    pushCheckoutHistory(step)
  }
})

watch(address, () => {
  sessionStorage.setItem(ADDRESS_KEY, JSON.stringify({ ...address }))
}, { deep: true })

function authHeaders() {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('access')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(formatApiError(data))
  }

  return data
}

async function loadCart() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    cart.value = await apiRequest('/api/v1/cart/')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

async function submitAddress() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const session = await ensureCheckoutSession()
    checkoutSession.value = await apiRequest(
      `/api/v1/checkout/session/${session.id}/address/`,
      {
        method: 'PATCH',
        body: JSON.stringify({ ...address }),
      },
    )
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(checkoutSession.value))
    setCheckoutStep('payment')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}

async function ensureCheckoutSession() {
  if (checkoutSession.value?.id) {
    return checkoutSession.value
  }

  const session = await apiRequest('/api/v1/checkout/session/', {
    method: 'POST',
    headers: {
      'Idempotency-Key': getIdempotencyKey(),
    },
    body: JSON.stringify({}),
  })
  checkoutSession.value = session
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

function submitPayment() {
  if (!canSubmitPayment.value) {
    errorMessage.value = 'Enter complete payment details.'
    return
  }

  errorMessage.value = ''
  paymentSummary.value = {
    cardholder: payment.cardholder.trim(),
    last4: digitsOnly(payment.card_number).slice(-4),
  }
  sessionStorage.setItem(PAYMENT_KEY, JSON.stringify(paymentSummary.value))
  setCheckoutStep('confirmation')
}

function goToStep(stepId) {
  if (stepId === 'address') {
    setCheckoutStep(stepId)
    return
  }

  if (stepId === 'payment' && checkoutSession.value?.id) {
    setCheckoutStep(stepId)
    return
  }

  if (stepId === 'confirmation' && paymentSummary.value) {
    setCheckoutStep(stepId)
  }
}

function goBackToStep(stepId) {
  if (window.history.state?.checkoutStep === currentStep.value) {
    window.history.back()
    return
  }

  setCheckoutStep(stepId)
}

function setCheckoutStep(step) {
  if (isKnownStep(step)) {
    currentStep.value = step
  }
}

function resetCheckout() {
  sessionStorage.removeItem(STEP_KEY)
  sessionStorage.removeItem(ADDRESS_KEY)
  sessionStorage.removeItem(IDEMPOTENCY_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(PAYMENT_KEY)
  emit('close')
}

function getIdempotencyKey() {
  const existingKey = sessionStorage.getItem(IDEMPOTENCY_KEY)
  if (existingKey) {
    return existingKey
  }

  const generatedKey = window.crypto?.randomUUID?.() || `checkout-${Date.now()}`
  sessionStorage.setItem(IDEMPOTENCY_KEY, generatedKey)
  return generatedKey
}

function readStoredStep() {
  const storedStep = sessionStorage.getItem(STEP_KEY)
  return isKnownStep(storedStep) ? storedStep : 'address'
}

function readJson(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || fallback
  } catch {
    return fallback
  }
}

function digitsOnly(value) {
  return value.replace(/\D/g, '')
}

function initializeCheckoutHistory() {
  persistWizardStep(currentStep.value)
  window.history.replaceState(
    {
      ...window.history.state,
      checkoutFlow: HISTORY_NAMESPACE,
      checkoutStep: currentStep.value,
    },
    '',
    window.location.href,
  )
  window.addEventListener('popstate', handlePopState)
}

function pushCheckoutHistory(step) {
  const currentHistoryState = window.history.state || {}
  if (
    currentHistoryState.checkoutFlow === HISTORY_NAMESPACE
    && currentHistoryState.checkoutStep === step
  ) {
    return
  }

  window.history.pushState(
    {
      ...currentHistoryState,
      checkoutFlow: HISTORY_NAMESPACE,
      checkoutStep: step,
    },
    '',
    window.location.href,
  )
}

function handlePopState(event) {
  const step = event.state?.checkoutStep
  if (!isKnownStep(step)) {
    return
  }

  isApplyingHistoryStep = true
  currentStep.value = step
  persistWizardStep(step)
  isApplyingHistoryStep = false
}

function persistWizardStep(step) {
  if (isKnownStep(step)) {
    sessionStorage.setItem(STEP_KEY, step)
  }
}

function isKnownStep(stepId) {
  return steps.some((step) => step.id === stepId)
}

function formatApiError(data) {
  if (data.detail) {
    return data.detail
  }

  const firstField = Object.keys(data)[0]
  const firstError = firstField ? data[firstField] : null
  if (Array.isArray(firstError)) {
    return `${firstField}: ${firstError[0]}`
  }

  if (firstError && typeof firstError === 'object') {
    const nestedField = Object.keys(firstError)[0]
    const nestedError = nestedField ? firstError[nestedField] : null
    if (Array.isArray(nestedError)) {
      return `${nestedField}: ${nestedError[0]}`
    }
  }

  return 'Checkout request failed.'
}

onMounted(() => {
  initializeCheckoutHistory()
  loadCart()
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 py-8" aria-labelledby="checkout-title">
    <div class="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase text-emerald-700">Secure checkout</p>
        <h1 id="checkout-title" class="mt-2 text-3xl font-bold text-neutral-950">
          Complete your order
        </h1>
      </div>

      <button
        class="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        type="button"
        @click="emit('close')"
      >
        Back to store
      </button>
    </div>

    <ol class="grid gap-2 sm:grid-cols-3" aria-label="Checkout steps">
      <li v-for="(step, index) in steps" :key="step.id">
        <button
          class="flex h-12 w-full items-center gap-3 rounded-md border px-3 text-left text-sm transition"
          :class="index <= activeStepIndex ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-neutral-200 bg-white text-neutral-500'"
          type="button"
          @click="goToStep(step.id)"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">
            {{ index + 1 }}
          </span>
          <span class="font-semibold">{{ step.label }}</span>
        </button>
      </li>
    </ol>

    <div v-if="errorMessage" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <form v-if="currentStep === 'address'" class="grid gap-4" @submit.prevent="submitAddress">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              Full name
              <input v-model="address.full_name" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
            </label>
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              Phone
              <input v-model="address.phone" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
            </label>
          </div>

          <label class="grid gap-1 text-sm font-medium text-neutral-700">
            Address line 1
            <input v-model="address.line1" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
          </label>

          <label class="grid gap-1 text-sm font-medium text-neutral-700">
            Address line 2
            <input v-model="address.line2" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
          </label>

          <div class="grid gap-4 sm:grid-cols-3">
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              City
              <input v-model="address.city" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
            </label>
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              Postal code
              <input v-model="address.postal_code" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
            </label>
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              Country
              <input v-model="address.country" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
            </label>
          </div>

          <label class="grid gap-1 text-sm font-medium text-neutral-700">
            State or region
            <input v-model="address.state" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
          </label>

          <div class="flex justify-end pt-2">
            <button
              class="h-11 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              type="submit"
              :disabled="isSubmitting"
            >
              Continue to payment
            </button>
          </div>
        </form>

        <form v-else-if="currentStep === 'payment'" class="grid gap-4" @submit.prevent="submitPayment">
          <label class="grid gap-1 text-sm font-medium text-neutral-700">
            Name on card
            <input v-model="payment.cardholder" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
          </label>

          <label class="grid gap-1 text-sm font-medium text-neutral-700">
            Card number
            <input v-model="payment.card_number" inputmode="numeric" autocomplete="cc-number" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="4242 4242 4242 4242" required>
          </label>

          <div class="grid grid-cols-2 gap-4">
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              Expiry
              <input v-model="payment.expiry" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="MM/YY" required>
            </label>
            <label class="grid gap-1 text-sm font-medium text-neutral-700">
              CVC
              <input v-model="payment.cvc" inputmode="numeric" autocomplete="cc-csc" class="h-11 rounded-md border border-neutral-300 px-3 text-neutral-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required>
            </label>
          </div>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <button class="h-11 rounded-md border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100" type="button" @click="goBackToStep('address')">
              Back
            </button>
            <button
              class="h-11 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              type="submit"
              :disabled="!canSubmitPayment"
            >
              Review order
            </button>
          </div>
        </form>

        <div v-else class="grid gap-5">
          <div class="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <h2 class="text-lg font-semibold text-emerald-950">Checkout details saved</h2>
            <p class="mt-1 text-sm text-emerald-800">
              Your address and payment details are ready for the final order creation step.
            </p>
          </div>

          <dl class="grid gap-3 text-sm">
            <div class="flex justify-between gap-4 border-b border-neutral-100 pb-3">
              <dt class="text-neutral-500">Checkout session</dt>
              <dd class="font-semibold text-neutral-950">#{{ checkoutSession?.id || 'Pending' }}</dd>
            </div>
            <div class="flex justify-between gap-4 border-b border-neutral-100 pb-3">
              <dt class="text-neutral-500">Ship to</dt>
              <dd class="text-right font-semibold text-neutral-950">{{ address.city }}, {{ address.country }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-neutral-500">Payment</dt>
              <dd class="font-semibold text-neutral-950">{{ maskedCard }}</dd>
            </div>
          </dl>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button class="h-11 rounded-md border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100" type="button" @click="goBackToStep('payment')">
              Back
            </button>
            <button class="h-11 rounded-md bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800" type="button" @click="resetCheckout">
              Finish
            </button>
          </div>
        </div>
      </div>

      <aside class="self-start rounded-md border border-neutral-200 bg-white p-5 shadow-sm" aria-label="Order summary">
        <h2 class="text-base font-semibold text-neutral-950">Order summary</h2>

        <div v-if="isLoading" class="mt-4 space-y-3">
          <div v-for="index in 3" :key="index" class="h-14 animate-pulse rounded-md bg-neutral-100" />
        </div>

        <ul v-else class="mt-4 space-y-3">
          <li v-for="item in cart.items" :key="item.id" class="flex justify-between gap-3 text-sm">
            <div class="min-w-0">
              <p class="truncate font-medium text-neutral-950">{{ item.product_name || `Variant #${item.product_variant_id}` }}</p>
              <p class="text-neutral-500">Qty {{ item.quantity }}</p>
            </div>
            <p class="font-semibold text-neutral-950">${{ Number(item.line_total).toFixed(2) }}</p>
          </li>
        </ul>

        <div class="mt-5 space-y-2 border-t border-neutral-200 pt-4 text-sm">
          <div class="flex justify-between">
            <span class="text-neutral-500">Subtotal</span>
            <span class="font-medium text-neutral-950">${{ subtotal }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-500">Shipping</span>
            <span class="font-medium text-neutral-950">${{ shippingEstimate.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-950">
            <span>Total</span>
            <span>${{ total }}</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
