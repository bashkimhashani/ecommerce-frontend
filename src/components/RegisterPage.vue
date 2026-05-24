<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const emit = defineEmits(['register-success'])
const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'customer',
})
const touched = reactive({
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
})
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const errors = computed(() => {
  const nextErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function fieldError(field) {
  return touched[field] ? errors.value[field] : ''
}

function touchAllFields() {
  Object.keys(touched).forEach((field) => {
    touched[field] = true
  })
}

function parseRegisterError(payload) {
  const fieldErrors = ['email', 'first_name', 'last_name', 'password', 'role']
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
  return 'Could not create your account.'
}

async function submitRegistration() {
  touchAllFields()
  errorMessage.value = ''
  successMessage.value = ''

  if (!canSubmit.value) {
    errorMessage.value = 'Fix the highlighted fields before continuing.'
    return
  }

  isSubmitting.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        password: form.password,
        role: form.role,
      }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(parseRegisterError(payload))
    }

    authStore.setSession(payload)
    successMessage.value = 'Account created successfully.'
    emit('register-success', payload.user)
  } catch (error) {
    errorMessage.value = error.message || 'Could not create your account.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
    <section class="grid min-h-[calc(100vh-81px)] bg-white lg:grid-cols-[minmax(0,1fr)_480px]">
      <div class="flex flex-col justify-between border-r border-slate-200 px-6 py-10 sm:px-10 lg:px-14">
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">Create account</p>
          <h1 class="mt-4 max-w-2xl text-4xl font-semibold text-slate-950">
            Start shopping or managing your store in Vendora.
          </h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Register with your email and choose the account type that matches your role.
          </p>
        </div>

        <dl class="mt-10 grid max-w-2xl gap-4 text-sm text-slate-600 sm:grid-cols-3">
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Secure</dt>
            <dd class="mt-1">JWT session after signup.</dd>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Fast</dt>
            <dd class="mt-1">Inline checks before submit.</dd>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Flexible</dt>
            <dd class="mt-1">Customer or vendor access.</dd>
          </div>
        </dl>
      </div>

      <div class="flex items-center px-6 py-10 sm:px-10">
        <form class="w-full" novalidate @submit.prevent="submitRegistration">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Register</h2>
            <p class="mt-2 text-sm text-slate-500">All fields are required.</p>
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

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700" for="register-first-name">
                First name
              </label>
              <input
                id="register-first-name"
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
              <label class="block text-sm font-medium text-slate-700" for="register-last-name">
                Last name
              </label>
              <input
                id="register-last-name"
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

          <label class="mt-5 block text-sm font-medium text-slate-700" for="register-email">
            Email
          </label>
          <input
            id="register-email"
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

          <label class="mt-5 block text-sm font-medium text-slate-700" for="register-role">
            Account type
          </label>
          <select
            id="register-role"
            v-model="form.role"
            class="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
          >
            <option value="customer">Customer</option>
            <option value="vendor_admin">Vendor</option>
          </select>

          <label class="mt-5 block text-sm font-medium text-slate-700" for="register-password">
            Password
          </label>
          <input
            id="register-password"
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

          <label class="mt-5 block text-sm font-medium text-slate-700" for="register-confirm-password">
            Confirm password
          </label>
          <input
            id="register-confirm-password"
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

          <button
            class="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Creating account...' : 'Create account' }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
