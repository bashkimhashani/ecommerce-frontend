<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const emit = defineEmits(["forgot-password", "login-success"]);
const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");
const isSubmitting = ref(false);

const canSubmit = computed(
  () => email.value.trim() !== "" && password.value !== "" && !isSubmitting.value
);

function parseLoginError(payload) {
  if (payload?.detail) return payload.detail;
  if (payload?.email?.length) return payload.email[0];
  if (payload?.password?.length) return payload.password[0];
  if (payload?.non_field_errors?.length) return payload.non_field_errors[0];
  return "Could not sign in with those credentials.";
}

function openRegister() {
  router.push({ name: "register" });
}

function openVendorRegister() {
  router.push({ name: "tenant-register" });
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push({ name: "register" });
}

async function submitLogin() {
  if (!canSubmit.value) {
    errorMessage.value = "Enter your email and password.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(parseLoginError(payload));
    }

    authStore.setSession(payload);
    emit("login-success", payload.user);
  } catch (error) {
    errorMessage.value = error.message || "Could not sign in right now.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main
    class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.22),_transparent_34%),linear-gradient(135deg,_#f8fafc_0%,_#eef7ff_42%,_#020617_42%,_#0f172a_100%)] px-4 py-6 text-slate-950"
  >
    <section class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-2xl border border-white/70 bg-white/88 shadow-2xl shadow-slate-950/20 backdrop-blur xl:grid-cols-[1fr_440px]">
      <div class="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-10 py-10 text-white xl:flex">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.35),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.18),_transparent_26%)]" />
        <div class="relative">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-3 py-2">
            <img class="h-9 w-auto" src="../assets/images/logo.png" alt="Vendora" />
            <span class="text-sm font-black tracking-wide">Vendora</span>
          </div>
          <h1 class="mt-12 max-w-xl text-5xl font-black leading-tight">
            One account for shopping and storefront control.
          </h1>
          <p class="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Sign in to continue to your catalog, wishlist, checkout, or vendor inventory.
          </p>
        </div>

        <div class="relative grid grid-cols-3 gap-3 text-sm">
          <div class="rounded-xl border border-white/10 bg-white/8 p-4">
            <p class="font-bold text-cyan-200">Catalog</p>
            <p class="mt-1 text-slate-400">Browse tenant-aware products.</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/8 p-4">
            <p class="font-bold text-emerald-200">Vendor</p>
            <p class="mt-1 text-slate-400">Manage your own listings.</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/8 p-4">
            <p class="font-bold text-amber-200">Secure</p>
            <p class="mt-1 text-slate-400">JWT login for every session.</p>
          </div>
        </div>
      </div>

      <div class="flex items-center px-6 py-8 sm:px-10">
        <form class="w-full" @submit.prevent="submitLogin">
          <button
            type="button"
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-cyan-300 hover:text-slate-950"
            @click="goBack"
          >
            <span aria-hidden="true">&lt;</span>
            Back
          </button>

          <div class="mb-8 xl:hidden">
            <img class="h-12 w-auto" src="../assets/images/logo.png" alt="Vendora" />
          </div>

          <p class="text-sm font-bold uppercase tracking-wide text-cyan-700">Welcome back</p>
          <h2 class="mt-3 text-3xl font-black text-slate-950">Sign in</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            Use your customer or vendor account email to continue.
          </p>

          <div
            v-if="errorMessage"
            class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {{ errorMessage }}
          </div>

          <label class="mt-6 block text-sm font-bold text-slate-700" for="login-email">
            Email
          </label>
          <input
            id="login-email"
            v-model="email"
            class="mt-2 block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
          />

          <label class="mt-5 block text-sm font-bold text-slate-700" for="login-password">
            Password
          </label>
          <div class="relative mt-2">
            <input
              id="login-password"
              v-model="password"
              class="block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Your password"
              required
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="!showPassword"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
                <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.1 18.1 0 0 1-3.2 4.4" />
                <path d="M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 8 10 8a10.8 10.8 0 0 0 4.1-.8" />
              </svg>
            </button>
          </div>

          <button
            class="mt-7 inline-flex h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:translate-y-0"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Signing in..." : "Sign in" }}
          </button>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              class="font-bold text-slate-600 transition hover:text-slate-950"
              @click="emit('forgot-password')"
            >
              Forgot password?
            </button>
            <button
              type="button"
              class="font-bold text-cyan-700 transition hover:text-cyan-900"
              @click="openRegister"
            >
              Create customer account
            </button>
          </div>

          <button
            type="button"
            class="mt-5 flex w-full items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-bold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100"
            @click="openVendorRegister"
          >
            <span>Register a vendor storefront</span>
            <span aria-hidden="true">-></span>
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
