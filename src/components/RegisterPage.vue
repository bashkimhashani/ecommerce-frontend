<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const emit = defineEmits(["register-success"]);
const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const touched = reactive({
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
});
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const errors = computed(() => {
  const nextErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
  if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
  if (!form.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(form.email.trim())) {
    nextErrors.email = "Enter a valid email address.";
  }
  if (!form.password) {
    nextErrors.password = "Password is required.";
  } else if (form.password.length < 8) {
    nextErrors.password = "Password must be at least 8 characters.";
  }
  if (!form.confirmPassword) {
    nextErrors.confirmPassword = "Confirm your password.";
  } else if (form.confirmPassword !== form.password) {
    nextErrors.confirmPassword = "Passwords do not match.";
  }

  return nextErrors;
});

const canSubmit = computed(() => Object.keys(errors.value).length === 0 && !isSubmitting.value);

function fieldError(field) {
  return touched[field] ? errors.value[field] : "";
}

function touchAllFields() {
  Object.keys(touched).forEach((field) => {
    touched[field] = true;
  });
}

function parseRegisterError(payload) {
  const fieldErrors = ["email", "first_name", "last_name", "password"];
  for (const field of fieldErrors) {
    if (payload?.[field]?.length) return payload[field][0];
  }
  if (payload?.non_field_errors?.length) return payload.non_field_errors[0];
  if (payload?.detail) return payload.detail;
  return "Could not create your account.";
}

function openLogin() {
  router.push({ name: "login" });
}

function openVendorRegister() {
  router.push({ name: "tenant-register" });
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push({ name: "login" });
}

async function submitRegistration() {
  touchAllFields();
  errorMessage.value = "";
  successMessage.value = "";

  if (!canSubmit.value) {
    errorMessage.value = "Fix the highlighted fields before continuing.";
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        password: form.password,
        role: "customer",
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(parseRegisterError(payload));
    }

    authStore.setSession(payload);
    successMessage.value = "Account created successfully.";
    emit("register-success", payload.user);
  } catch (error) {
    errorMessage.value = error.message || "Could not create your account.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main
    class="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_34%),linear-gradient(135deg,_#020617_0%,_#0f172a_42%,_#f8fafc_42%,_#ecfeff_100%)] px-4 py-6 text-slate-950"
  >
    <section class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-2xl border border-white/70 bg-white/88 shadow-2xl shadow-slate-950/20 backdrop-blur xl:grid-cols-[440px_1fr]">
      <div class="flex items-center px-6 py-8 sm:px-10">
        <form class="w-full" novalidate @submit.prevent="submitRegistration">
          <button
            type="button"
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-emerald-300 hover:text-slate-950"
            @click="goBack"
          >
            <span aria-hidden="true">&lt;</span>
            Back
          </button>

          <img class="mb-8 h-12 w-auto" src="../assets/images/logo.png" alt="Vendora" />

          <p class="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Customer account
          </p>
          <h2 class="mt-3 text-3xl font-black text-slate-950">Create your account</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            Save favorites, check out faster, and keep your order history in one place.
          </p>

          <div
            v-if="errorMessage"
            class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {{ errorMessage }}
          </div>
          <div
            v-if="successMessage"
            class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {{ successMessage }}
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="relative">
              <label class="block text-sm font-bold text-slate-700" for="register-first-name">
                First name
              </label>
              <input
                id="register-first-name"
                v-model="form.firstName"
                class="mt-2 block h-12 w-full rounded-lg border bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                :class="fieldError('firstName') ? 'border-red-300' : 'border-slate-300'"
                type="text"
                autocomplete="given-name"
                @blur="touched.firstName = true"
              />
              <p v-if="fieldError('firstName')" class="mt-1 text-xs text-red-600">
                {{ fieldError("firstName") }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700" for="register-last-name">
                Last name
              </label>
              <input
                id="register-last-name"
                v-model="form.lastName"
                class="mt-2 block h-12 w-full rounded-lg border bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                :class="fieldError('lastName') ? 'border-red-300' : 'border-slate-300'"
                type="text"
                autocomplete="family-name"
                @blur="touched.lastName = true"
              />
              <p v-if="fieldError('lastName')" class="mt-1 text-xs text-red-600">
                {{ fieldError("lastName") }}
              </p>
            </div>
          </div>

          <label class="mt-5 block text-sm font-bold text-slate-700" for="register-email">
            Email
          </label>
          <input
            id="register-email"
            v-model="form.email"
            class="mt-2 block h-12 w-full rounded-lg border bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            :class="fieldError('email') ? 'border-red-300' : 'border-slate-300'"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            @blur="touched.email = true"
          />
          <p v-if="fieldError('email')" class="mt-1 text-xs text-red-600">
            {{ fieldError("email") }}
          </p>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-bold text-slate-700" for="register-password">
                Password
              </label>
              <input
                id="register-password"
                v-model="form.password"
                class="mt-2 block h-12 w-full rounded-lg border bg-white px-4 pr-12 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                :class="fieldError('password') ? 'border-red-300' : 'border-slate-300'"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                @blur="touched.password = true"
              />
              <button
                type="button"
                class="absolute right-2 top-8 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    v-if="!showPassword"
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                  />
                  <circle v-if="!showPassword" cx="12" cy="12" r="3" />
                  <path v-if="showPassword" d="M3 3l18 18" />
                  <path v-if="showPassword" d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
                  <path
                    v-if="showPassword"
                    d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.1 18.1 0 0 1-3.2 4.4"
                  />
                  <path
                    v-if="showPassword"
                    d="M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 8 10 8a10.8 10.8 0 0 0 4.1-.8"
                  />
                </svg>
              </button>
              <p v-if="fieldError('password')" class="mt-1 text-xs text-red-600">
                {{ fieldError("password") }}
              </p>
            </div>

            <div class="relative">
              <label
                class="block text-sm font-bold text-slate-700"
                for="register-confirm-password"
              >
                Confirm
              </label>
              <input
                id="register-confirm-password"
                v-model="form.confirmPassword"
                class="mt-2 block h-12 w-full rounded-lg border bg-white px-4 pr-12 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                :class="fieldError('confirmPassword') ? 'border-red-300' : 'border-slate-300'"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                @blur="touched.confirmPassword = true"
              />
              <button
                type="button"
                class="absolute right-2 top-8 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    v-if="!showConfirmPassword"
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                  />
                  <circle v-if="!showConfirmPassword" cx="12" cy="12" r="3" />
                  <path v-if="showConfirmPassword" d="M3 3l18 18" />
                  <path v-if="showConfirmPassword" d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
                  <path
                    v-if="showConfirmPassword"
                    d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.1 18.1 0 0 1-3.2 4.4"
                  />
                  <path
                    v-if="showConfirmPassword"
                    d="M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 8 10 8a10.8 10.8 0 0 0 4.1-.8"
                  />
                </svg>
              </button>
              <p v-if="fieldError('confirmPassword')" class="mt-1 text-xs text-red-600">
                {{ fieldError("confirmPassword") }}
              </p>
            </div>
          </div>

          <button
            class="mt-7 inline-flex h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:translate-y-0"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Creating account..." : "Create customer account" }}
          </button>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              class="font-bold text-slate-600 transition hover:text-slate-950"
              @click="openLogin"
            >
              Already have an account?
            </button>
            <button
              type="button"
              class="font-bold text-emerald-700 transition hover:text-emerald-900"
              @click="openVendorRegister"
            >
              Register as vendor
            </button>
          </div>
        </form>
      </div>

      <div class="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-10 py-10 text-white xl:flex">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,_rgba(34,211,238,0.28),_transparent_30%),radial-gradient(circle_at_80%_80%,_rgba(16,185,129,0.22),_transparent_28%)]" />
        <div class="relative">
          <p class="text-sm font-bold uppercase tracking-wide text-cyan-200">Vendora signup</p>
          <h1 class="mt-5 max-w-xl text-5xl font-black leading-tight">
            Choose the account that fits how you use the store.
          </h1>
          <p class="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Customers get the full marketplace. Vendors get a tenant storefront and dashboard for
            their own products.
          </p>
        </div>

        <button
          type="button"
          class="relative rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-5 text-left transition hover:border-emerald-200 hover:bg-emerald-300/15"
          @click="openVendorRegister"
        >
          <span class="block text-sm font-black text-emerald-100">Vendor storefront</span>
          <span class="mt-2 block text-sm leading-6 text-slate-300">
            Register a business tenant, create the vendor admin, and start adding products.
          </span>
        </button>
      </div>
    </section>
  </main>
</template>
