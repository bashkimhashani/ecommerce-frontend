<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const emit = defineEmits(["forgot-password", "login-success"]);
const authStore = useAuthStore();
const route = useRoute();

const activeMode = ref("login");
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const loginForm = reactive({
  email: typeof route.query.email === "string" ? route.query.email : "",
  password: "",
});

const registerForm = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const vendorForm = reactive({
  businessName: "",
  slug: "",
  domain: "",
  plan: "basic",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const planOptions = [
  { id: "free", name: "Free", price: "$0" },
  { id: "basic", name: "Basic", price: "$29" },
  { id: "premium", name: "Premium", price: "$79" },
];

const modeTitle = computed(() => {
  if (activeMode.value === "vendor") return "Open a vendor storefront";
  if (activeMode.value === "register") return "Create a customer account";
  return "Welcome back";
});

const modeSubtitle = computed(() => {
  if (activeMode.value === "vendor") {
    return "Create a tenant, vendor dashboard, and vendor admin account in one step.";
  }
  if (activeMode.value === "register") {
    return "Save your wishlist, profile, and orders with a customer account.";
  }
  return "Sign in to continue shopping or managing your Vendora store.";
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setMode(mode) {
  activeMode.value = mode;
  errorMessage.value = "";
  successMessage.value = "";
}

function updateVendorSlug() {
  vendorForm.slug = slugify(vendorForm.businessName);
}

function parseApiError(payload, fallback) {
  const field = Object.keys(payload || {}).find((key) => Array.isArray(payload[key]));
  if (field) return payload[field][0];
  return payload?.detail || payload?.non_field_errors?.[0] || fallback;
}

function validatePasswords(form) {
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  return "";
}

async function submitLogin() {
  if (!loginForm.email.trim() || !loginForm.password) {
    errorMessage.value = "Enter your email and password.";
    return;
  }

  await submitAuthRequest(`${API_BASE_URL}/api/v1/auth/login/`, {
    email: loginForm.email.trim(),
    password: loginForm.password,
  });
}

async function submitCustomerRegistration() {
  const passwordError = validatePasswords(registerForm);
  if (passwordError) {
    errorMessage.value = passwordError;
    return;
  }

  await submitAuthRequest(
    `${API_BASE_URL}/api/v1/auth/register/`,
    {
      email: registerForm.email.trim(),
      first_name: registerForm.firstName.trim(),
      last_name: registerForm.lastName.trim(),
      password: registerForm.password,
      role: "customer",
    },
    "Customer account created."
  );
}

async function submitVendorRegistration() {
  const passwordError = validatePasswords(vendorForm);
  if (passwordError) {
    errorMessage.value = passwordError;
    return;
  }

  await submitAuthRequest(
    `${API_BASE_URL}/api/v1/tenants/register/`,
    {
      name: vendorForm.businessName.trim(),
      slug: vendorForm.slug.trim(),
      domain: vendorForm.domain.trim().toLowerCase(),
      plan: vendorForm.plan,
      email: vendorForm.email.trim(),
      first_name: vendorForm.firstName.trim(),
      last_name: vendorForm.lastName.trim(),
      phone: vendorForm.phone.trim(),
      password: vendorForm.password,
    },
    "Vendor account and tenant created."
  );
}

async function submitAuthRequest(url, body, successText = "Signed in.") {
  isSubmitting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(parseApiError(payload, "Could not complete this request."));
    }

    authStore.setSession(payload);
    successMessage.value = successText;
    emit("login-success", payload.user);
  } catch (error) {
    errorMessage.value = error.message || "Could not complete this request.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main
    class="mx-auto flex min-h-0 w-full max-w-7xl flex-1 items-stretch border-x border-cyan-100 bg-white text-slate-950 dark:border-cyan-400/10 dark:bg-slate-950 dark:text-slate-100"
  >
    <section
      class="grid min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_42%,#052e2b_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#ecfeff_150%)] lg:grid-cols-[minmax(0,1fr)_500px]"
    >
      <div class="flex flex-col justify-between gap-8 px-6 py-10 sm:px-10 lg:px-14">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
            Vendora access
          </p>
          <h1 class="mt-4 max-w-2xl text-4xl font-black leading-tight text-slate-950 dark:text-white">
            Login, shop, or launch your own tech storefront.
          </h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-700 dark:text-slate-300">
            Vendors get a private tenant and only see the products, inventory, and reports created
            inside their own store.
          </p>
        </div>

        <div class="grid gap-3 text-sm sm:grid-cols-3">
          <div class="rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-cyan-400/10 dark:bg-slate-900/70">
            <p class="font-black text-slate-950 dark:text-white">Customer</p>
            <p class="mt-1 text-slate-600 dark:text-slate-400">Wishlist and checkout.</p>
          </div>
          <div class="rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-cyan-400/10 dark:bg-slate-900/70">
            <p class="font-black text-slate-950 dark:text-white">Vendor</p>
            <p class="mt-1 text-slate-600 dark:text-slate-400">Tenant-scoped dashboard.</p>
          </div>
          <div class="rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-cyan-400/10 dark:bg-slate-900/70">
            <p class="font-black text-slate-950 dark:text-white">Secure</p>
            <p class="mt-1 text-slate-600 dark:text-slate-400">JWT account sessions.</p>
          </div>
        </div>
      </div>

      <div class="min-h-0 overflow-y-auto border-l border-white/70 bg-white/88 px-6 py-8 backdrop-blur-xl dark:border-cyan-400/10 dark:bg-slate-950/88 sm:px-8">
        <div class="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            v-for="mode in [
              { id: 'login', label: 'Login' },
              { id: 'register', label: 'User' },
              { id: 'vendor', label: 'Vendor' },
            ]"
            :key="mode.id"
            type="button"
            class="flex-1 rounded-lg px-3 py-2 text-sm font-black transition"
            :class="
              activeMode === mode.id
                ? 'bg-slate-950 text-white shadow-sm dark:bg-cyan-300 dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            "
            @click="setMode(mode.id)"
          >
            {{ mode.label }}
          </button>
        </div>

        <div class="mt-7">
          <h2 class="text-2xl font-black text-slate-950 dark:text-white">{{ modeTitle }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {{ modeSubtitle }}
          </p>
        </div>

        <p
          v-if="errorMessage"
          class="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {{ errorMessage }}
        </p>
        <p
          v-if="successMessage"
          class="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {{ successMessage }}
        </p>

        <form v-if="activeMode === 'login'" class="mt-6 space-y-4" @submit.prevent="submitLogin">
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-200" for="login-email">Email</label>
          <input id="login-email" v-model="loginForm.email" class="auth-input" type="email" autocomplete="email" required />
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-200" for="login-password">Password</label>
          <input id="login-password" v-model="loginForm.password" class="auth-input" type="password" autocomplete="current-password" required />
          <button class="auth-primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Signing in..." : "Sign in" }}
          </button>
          <button type="button" class="text-sm font-bold text-cyan-700 hover:text-cyan-900 dark:text-cyan-300" @click="emit('forgot-password')">
            Forgot password?
          </button>
        </form>

        <form v-else-if="activeMode === 'register'" class="mt-6 space-y-4" @submit.prevent="submitCustomerRegistration">
          <div class="grid gap-4 sm:grid-cols-2">
            <input v-model="registerForm.firstName" class="auth-input" type="text" placeholder="First name" autocomplete="given-name" required />
            <input v-model="registerForm.lastName" class="auth-input" type="text" placeholder="Last name" autocomplete="family-name" required />
          </div>
          <input v-model="registerForm.email" class="auth-input" type="email" placeholder="Email" autocomplete="email" required />
          <input v-model="registerForm.password" class="auth-input" type="password" placeholder="Password" autocomplete="new-password" required />
          <input v-model="registerForm.confirmPassword" class="auth-input" type="password" placeholder="Confirm password" autocomplete="new-password" required />
          <button class="auth-primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Creating account..." : "Create user account" }}
          </button>
        </form>

        <form v-else class="mt-6 space-y-4" @submit.prevent="submitVendorRegistration">
          <input v-model="vendorForm.businessName" class="auth-input" type="text" placeholder="Business name" autocomplete="organization" required @input="updateVendorSlug" />
          <div class="grid gap-4 sm:grid-cols-2">
            <input v-model="vendorForm.slug" class="auth-input" type="text" placeholder="Store slug" required />
            <input v-model="vendorForm.domain" class="auth-input" type="text" placeholder="shop.example.com" required />
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <label
              v-for="plan in planOptions"
              :key="plan.id"
              class="cursor-pointer rounded-xl border p-3 transition"
              :class="vendorForm.plan === plan.id ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/40' : 'border-slate-200 dark:border-slate-800'"
            >
              <input v-model="vendorForm.plan" class="sr-only" type="radio" :value="plan.id" />
              <span class="block text-sm font-black">{{ plan.name }}</span>
              <span class="mt-1 block text-lg font-black">{{ plan.price }}</span>
            </label>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <input v-model="vendorForm.firstName" class="auth-input" type="text" placeholder="Owner first name" autocomplete="given-name" required />
            <input v-model="vendorForm.lastName" class="auth-input" type="text" placeholder="Owner last name" autocomplete="family-name" required />
          </div>
          <input v-model="vendorForm.email" class="auth-input" type="email" placeholder="Owner email" autocomplete="email" required />
          <input v-model="vendorForm.phone" class="auth-input" type="tel" placeholder="Phone" autocomplete="tel" />
          <input v-model="vendorForm.password" class="auth-input" type="password" placeholder="Password" autocomplete="new-password" required />
          <input v-model="vendorForm.confirmPassword" class="auth-input" type="password" placeholder="Confirm password" autocomplete="new-password" required />
          <button class="auth-primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Creating storefront..." : "Create vendor storefront" }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-input {
  display: block;
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgb(203 213 225);
  background: rgb(255 255 255 / 0.92);
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  color: #020617;
  outline: none;
}

.auth-input:focus {
  border-color: #0891b2;
  box-shadow: 0 0 0 3px rgb(34 211 238 / 0.18);
}

.dark .auth-input {
  border-color: #334155;
  background: rgb(15 23 42 / 0.92);
  color: #f8fafc;
}

.auth-primary {
  display: inline-flex;
  height: 2.875rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: #020617;
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 900;
  color: white;
}

.auth-primary:hover {
  background: #0e7490;
}

.auth-primary:disabled {
  cursor: not-allowed;
  background: #94a3b8;
}

.dark .auth-primary {
  background: #67e8f9;
  color: #020617;
}
</style>
