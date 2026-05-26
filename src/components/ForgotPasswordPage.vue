<script setup>
import { computed, ref } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const emit = defineEmits(["back-to-login"]);

const email = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isSubmitting = ref(false);

const emailError = computed(() => {
  const value = email.value.trim();
  if (!value) {
    return "Email is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter a valid email address.";
  }
  return "";
});

function parseResetRequestError(payload) {
  if (payload?.email?.length) {
    return payload.email[0];
  }
  if (payload?.detail) {
    return payload.detail;
  }
  return "Could not request a password reset.";
}

async function submitForgotPassword() {
  errorMessage.value = "";
  successMessage.value = "";

  if (emailError.value) {
    errorMessage.value = emailError.value;
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/password-reset/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.value.trim() }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(parseResetRequestError(payload));
    }

    successMessage.value = payload.message || "If an account exists, a reset link has been sent.";
  } catch (error) {
    errorMessage.value = error.message || "Could not request a password reset.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
    <section class="grid min-h-[calc(100vh-81px)] bg-white lg:grid-cols-[minmax(0,1fr)_420px]">
      <div
        class="flex flex-col justify-between border-r border-slate-200 px-6 py-10 sm:px-10 lg:px-14"
      >
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">Password help</p>
          <h1 class="mt-4 max-w-2xl text-4xl font-semibold text-slate-950">
            Reset access to your Vendora account.
          </h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Enter your account email and we will send a reset link if the address exists.
          </p>
        </div>

        <button
          type="button"
          class="mt-10 w-fit text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          @click="emit('back-to-login')"
        >
          Back to login
        </button>
      </div>

      <div class="flex items-center px-6 py-10 sm:px-10">
        <form class="w-full" novalidate @submit.prevent="submitForgotPassword">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Forgot password</h2>
            <p class="mt-2 text-sm text-slate-500">Use the email connected to your account.</p>
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

          <label class="mt-6 block text-sm font-medium text-slate-700" for="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            v-model="email"
            class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            type="email"
            autocomplete="email"
          />

          <button
            class="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Sending link..." : "Send reset link" }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
