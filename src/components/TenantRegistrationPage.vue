<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const emit = defineEmits(['tenant-register-success'])
const authStore = useAuthStore()

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    summary: 'Launch with a small catalog.',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$29',
    summary: 'Sell with operational tools.',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$79',
    summary: 'Scale with advanced access.',
  },
]

const form = reactive({
  businessName: '',
  slug: '',
  domain: '',
  plan: 'basic',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const touched = reactive({
  businessName: false,
  slug: false,
  domain: false,
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
})
const autoSlug = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const errors = computed(() => {
  const nextErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const domainPattern = /^(?=.{1,255}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  if (!form.businessName.trim()) {
    nextErrors.businessName = 'Business name is required.'
  }
  if (!form.slug.trim()) {
    nextErrors.slug = 'Store slug is required.'
  } else if (!slugPattern.test(form.slug.trim())) {
    nextErrors.slug = 'Use lowercase letters, numbers, and hyphens.'
  }
  if (!form.domain.trim()) {
    nextErrors.domain = 'Business domain is required.'
  } else if (!domainPattern.test(form.domain.trim().toLowerCase())) {
    nextErrors.domain = 'Enter a valid domain name.'
  }
  if (!form.firstName.trim()) {
    nextErrors.firstName = 'First name is required.'
  }
  if (!form.lastName.trim()) {
    nextErrors.lastName = 'Last name is required.'
  }
  if (!form.email.trim()) {
    nextErrors.email = 'Email is required.'
  } else if (!emailPattern.test(form.email.trim())) {
    nextErrors.email = 'Enter a valid email address.'
  }
  if (!form.password) {
    nextErrors.password = 'Password is required.'
  } else if (form.password.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.'
  }
  if (!form.confirmPassword) {
    nextErrors.confirmPassword = 'Confirm your password.'
  } else if (form.confirmPassword !== form.password) {
    nextErrors.confirmPassword = 'Passwords do not match.'
  }

  return nextErrors
})

const canSubmit = computed(() => (
  Object.keys(errors.value).length === 0 &&
  !isSubmitting.value
))

watch(
  () => form.businessName,
  (businessName) => {
    if (autoSlug.value) {
      form.slug = slugify(businessName)
    }
  },
)

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fieldError(field) {
  return touched[field] ? errors.value[field] : ''
}

function touchAllFields() {
  Object.keys(touched).forEach((field) => {
    touched[field] = true
  })
}

function parseTenantRegistrationError(payload) {
  const fieldErrors = [
    'name',
    'slug',
    'domain',
    'plan',
    'email',
    'first_name',
    'last_name',
    'password',
    'phone',
  ]

  for (const field of fieldErrors) {
    if (payload?.[field]?.length) {
      return payload[field][0]
    }
  }
  if (payload?.non_field_errors?.length) {
    return payload.non_field_errors[0]
  }
  if (payload?.detail) {
    return payload.detail
  }
  return 'Could not register your business.'
}

async function submitTenantRegistration() {
  touchAllFields()
  errorMessage.value = ''
  successMessage.value = ''

  if (!canSubmit.value) {
    errorMessage.value = 'Fix the highlighted fields before continuing.'
    return
  }

  isSubmitting.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.businessName.trim(),
        slug: form.slug.trim(),
        domain: form.domain.trim().toLowerCase(),
        plan: form.plan,
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim(),
        password: form.password,
      }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(parseTenantRegistrationError(payload))
    }

    authStore.setSession(payload)
    successMessage.value = 'Business account created successfully.'
    emit('tenant-register-success', payload)
  } catch (error) {
    errorMessage.value = error.message || 'Could not register your business.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
    <section class="grid min-h-[calc(100vh-81px)] bg-white lg:grid-cols-[minmax(0,1fr)_560px]">
      <div class="flex flex-col justify-between border-r border-slate-200 px-6 py-10 sm:px-10 lg:px-14">
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">Vendor onboarding</p>
          <h1 class="mt-4 max-w-2xl text-4xl font-semibold text-slate-950">
            Register your business and open a Vendora storefront.
          </h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Create the tenant, choose a plan, and set up the vendor admin account in one flow.
          </p>
        </div>

        <dl class="mt-10 grid max-w-2xl gap-4 text-sm text-slate-600 sm:grid-cols-3">
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Tenant</dt>
            <dd class="mt-1">Dedicated store identity.</dd>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Plan</dt>
            <dd class="mt-1">Free, Basic, or Premium.</dd>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Admin</dt>
            <dd class="mt-1">Vendor session after signup.</dd>
          </div>
        </dl>
      </div>

      <div class="px-6 py-10 sm:px-10">
        <form class="w-full" novalidate @submit.prevent="submitTenantRegistration">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Business registration</h2>
            <p class="mt-2 text-sm text-slate-500">Business, plan, and owner details are required.</p>
          </div>

          <div
            v-if="errorMessage"
            class="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {{ errorMessage }}
          </div>
          <div
            v-if="successMessage"
            class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {{ successMessage }}
          </div>

          <fieldset class="mt-6">
            <legend class="text-sm font-semibold text-slate-950">Business info</legend>

            <label class="mt-4 block text-sm font-medium text-slate-700" for="tenant-business-name">
              Business name
            </label>
            <input
              id="tenant-business-name"
              v-model="form.businessName"
              class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
              :class="fieldError('businessName') ? 'border-red-300' : 'border-slate-300'"
              type="text"
              autocomplete="organization"
              @blur="touched.businessName = true"
            >
            <p v-if="fieldError('businessName')" class="mt-1 text-xs text-red-600">
              {{ fieldError('businessName') }}
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="tenant-slug">
                  Store slug
                </label>
                <input
                  id="tenant-slug"
                  v-model="form.slug"
                  class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                  :class="fieldError('slug') ? 'border-red-300' : 'border-slate-300'"
                  type="text"
                  autocomplete="off"
                  @input="autoSlug = false"
                  @blur="touched.slug = true"
                >
                <p v-if="fieldError('slug')" class="mt-1 text-xs text-red-600">
                  {{ fieldError('slug') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700" for="tenant-domain">
                  Business domain
                </label>
                <input
                  id="tenant-domain"
                  v-model="form.domain"
                  class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                  :class="fieldError('domain') ? 'border-red-300' : 'border-slate-300'"
                  type="text"
                  placeholder="shop.example.com"
                  autocomplete="url"
                  @blur="touched.domain = true"
                >
                <p v-if="fieldError('domain')" class="mt-1 text-xs text-red-600">
                  {{ fieldError('domain') }}
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset class="mt-7">
            <legend class="text-sm font-semibold text-slate-950">Plan selection</legend>
            <div class="mt-3 grid gap-3 sm:grid-cols-3">
              <label
                v-for="plan in plans"
                :key="plan.id"
                class="rounded-md border p-4 transition"
                :class="form.plan === plan.id ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'"
              >
                <input v-model="form.plan" class="sr-only" type="radio" name="tenant-plan" :value="plan.id">
                <span class="block text-sm font-semibold text-slate-950">{{ plan.name }}</span>
                <span class="mt-2 block text-xl font-semibold text-slate-950">{{ plan.price }}</span>
                <span class="mt-1 block text-xs leading-5 text-slate-500">{{ plan.summary }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="mt-7">
            <legend class="text-sm font-semibold text-slate-950">Owner account</legend>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="tenant-first-name">
                  First name
                </label>
                <input
                  id="tenant-first-name"
                  v-model="form.firstName"
                  class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                  :class="fieldError('firstName') ? 'border-red-300' : 'border-slate-300'"
                  type="text"
                  autocomplete="given-name"
                  @blur="touched.firstName = true"
                >
                <p v-if="fieldError('firstName')" class="mt-1 text-xs text-red-600">
                  {{ fieldError('firstName') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700" for="tenant-last-name">
                  Last name
                </label>
                <input
                  id="tenant-last-name"
                  v-model="form.lastName"
                  class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                  :class="fieldError('lastName') ? 'border-red-300' : 'border-slate-300'"
                  type="text"
                  autocomplete="family-name"
                  @blur="touched.lastName = true"
                >
                <p v-if="fieldError('lastName')" class="mt-1 text-xs text-red-600">
                  {{ fieldError('lastName') }}
                </p>
              </div>
            </div>

            <label class="mt-4 block text-sm font-medium text-slate-700" for="tenant-email">
              Email
            </label>
            <input
              id="tenant-email"
              v-model="form.email"
              class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
              :class="fieldError('email') ? 'border-red-300' : 'border-slate-300'"
              type="email"
              autocomplete="email"
              @blur="touched.email = true"
            >
            <p v-if="fieldError('email')" class="mt-1 text-xs text-red-600">
              {{ fieldError('email') }}
            </p>

            <label class="mt-4 block text-sm font-medium text-slate-700" for="tenant-phone">
              Phone
            </label>
            <input
              id="tenant-phone"
              v-model="form.phone"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
              type="tel"
              autocomplete="tel"
              @blur="touched.phone = true"
            >

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="tenant-password">
                  Password
                </label>
                <input
                  id="tenant-password"
                  v-model="form.password"
                  class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                  :class="fieldError('password') ? 'border-red-300' : 'border-slate-300'"
                  type="password"
                  autocomplete="new-password"
                  @blur="touched.password = true"
                >
                <p v-if="fieldError('password')" class="mt-1 text-xs text-red-600">
                  {{ fieldError('password') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700" for="tenant-confirm-password">
                  Confirm password
                </label>
                <input
                  id="tenant-confirm-password"
                  v-model="form.confirmPassword"
                  class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                  :class="fieldError('confirmPassword') ? 'border-red-300' : 'border-slate-300'"
                  type="password"
                  autocomplete="new-password"
                  @blur="touched.confirmPassword = true"
                >
                <p v-if="fieldError('confirmPassword')" class="mt-1 text-xs text-red-600">
                  {{ fieldError('confirmPassword') }}
                </p>
              </div>
            </div>
          </fieldset>

          <button
            class="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Creating storefront...' : 'Create storefront' }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
