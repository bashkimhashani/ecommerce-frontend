<script setup>
import { computed, ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const emit = defineEmits(['forgot-password', 'login-success'])

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => (
  email.value.trim() !== '' &&
  password.value !== '' &&
  !isSubmitting.value
))

function parseLoginError(payload) {
  if (payload?.detail) {
    return payload.detail
  }
  if (payload?.email?.length) {
    return payload.email[0]
  }
  if (payload?.password?.length) {
    return payload.password[0]
  }
  if (payload?.non_field_errors?.length) {
    return payload.non_field_errors[0]
  }
  return 'Could not sign in with those credentials.'
}

async function submitLogin() {
  if (!canSubmit.value) {
    errorMessage.value = 'Enter your email and password.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(parseLoginError(payload))
    }

    localStorage.setItem('accessToken', payload.access)
    localStorage.setItem('refreshToken', payload.refresh)
    localStorage.setItem('access', payload.access)
    localStorage.setItem('refresh', payload.refresh)
    if (payload.user) {
      localStorage.setItem('currentUser', JSON.stringify(payload.user))
    } else {
      localStorage.removeItem('currentUser')
    }

    emit('login-success', payload.user)
  } catch (error) {
    errorMessage.value = error.message || 'Could not sign in right now.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
    <section class="grid min-h-[calc(100vh-81px)] bg-white lg:grid-cols-[minmax(0,1fr)_420px]">
      <div class="flex flex-col justify-between border-r border-slate-200 px-6 py-10 sm:px-10 lg:px-14">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Vendora account</p>
          <h1 class="mt-4 max-w-2xl text-4xl font-semibold text-slate-950">
            Sign in to manage orders, inventory, and checkout.
          </h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Use the email and password connected to your customer or vendor account.
          </p>
        </div>

        <dl class="mt-10 grid max-w-2xl gap-4 text-sm text-slate-600 sm:grid-cols-3">
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Orders</dt>
            <dd class="mt-1">View your order history.</dd>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Checkout</dt>
            <dd class="mt-1">Keep payment flow secure.</dd>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <dt class="font-semibold text-slate-950">Vendor</dt>
            <dd class="mt-1">Access stock and reports.</dd>
          </div>
        </dl>
      </div>

      <div class="flex items-center px-6 py-10 sm:px-10">
        <form class="w-full" @submit.prevent="submitLogin">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Login</h2>
            <p class="mt-2 text-sm text-slate-500">Your session will be saved in this browser.</p>
          </div>

          <div
            v-if="errorMessage"
            class="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {{ errorMessage }}
          </div>

          <label class="mt-6 block text-sm font-medium text-slate-700" for="login-email">
            Email
          </label>
          <input
            id="login-email"
            v-model="email"
            class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            type="email"
            autocomplete="email"
            required
          >

          <label class="mt-5 block text-sm font-medium text-slate-700" for="login-password">
            Password
          </label>
          <input
            id="login-password"
            v-model="password"
            class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            type="password"
            autocomplete="current-password"
            required
          >

          <button
            class="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
          </button>

          <button
            type="button"
            class="mt-4 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            @click="emit('forgot-password')"
          >
            Forgot password?
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
