<script setup>
import { computed, reactive, ref } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const props = defineProps({
  uid: {
    type: String,
    default: "",
  },
  token: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["back-to-login"]);

const form = reactive({
  newPassword: "",
  confirmPassword: "",
});
const touched = reactive({
  newPassword: false,
  confirmPassword: false,
});
const errorMessage = ref("");
const successMessage = ref("");
const isSubmitting = ref(false);

const errors = computed(() => {
  const nextErrors = {};
  if (!form.newPassword) {
    nextErrors.newPassword = "New password is required.";
  } else if (form.newPassword.length < 8) {
    nextErrors.newPassword = "Password must be at least 8 characters.";
  }
  if (!form.confirmPassword) {
    nextErrors.confirmPassword = "Confirm your new password.";
  } else if (form.confirmPassword !== form.newPassword) {
    nextErrors.confirmPassword = "Passwords do not match.";
  }
  return nextErrors;
});

const hasResetToken = computed(() => props.uid && props.token);

function fieldError(field) {
  return touched[field] ? errors.value[field] : "";
}

function touchAllFields() {
  Object.keys(touched).forEach((field) => {
    touched[field] = true;
  });
}

function parseResetConfirmError(payload) {
  if (payload?.new_password?.length) {
    return payload.new_password[0];
  }
  if (payload?.token?.length) {
    return payload.token[0];
  }
  if (payload?.non_field_errors?.length) {
    return payload.non_field_errors[0];
  }
  if (payload?.detail) {
    return payload.detail;
  }
  return "Could not reset your password.";
}

async function submitResetPassword() {
  touchAllFields();
  errorMessage.value = "";
  successMessage.value = "";

  if (!hasResetToken.value) {
    errorMessage.value = "This reset link is missing required token details.";
    return;
  }
  if (Object.keys(errors.value).length > 0) {
    errorMessage.value = "Fix the highlighted fields before continuing.";
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/password-reset/confirm/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: props.uid,
        token: props.token,
        new_password: form.newPassword,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(parseResetConfirmError(payload));
    }

    successMessage.value = payload.message || "Password has been reset successfully.";
  } catch (error) {
    errorMessage.value = error.message || "Could not reset your password.";
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
          <p class="text-sm font-semibold uppercase text-emerald-700">New password</p>
          <h1 class="mt-4 max-w-2xl text-4xl font-semibold text-slate-950">
            Choose a fresh password for your account.
          </h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Use a password you have not used before and keep it at least 8 characters.
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
        <form class="w-full" novalidate @submit.prevent="submitResetPassword">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Reset password</h2>
            <p class="mt-2 text-sm text-slate-500">Enter and confirm your new password.</p>
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

          <label class="mt-6 block text-sm font-medium text-slate-700" for="reset-password">
            New password
          </label>
          <input
            id="reset-password"
            v-model="form.newPassword"
            class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            :class="fieldError('newPassword') ? 'border-red-300' : 'border-slate-300'"
            type="password"
            autocomplete="new-password"
            @blur="touched.newPassword = true"
          />
          <p v-if="fieldError('newPassword')" class="mt-1 text-xs text-red-600">
            {{ fieldError("newPassword") }}
          </p>

          <label class="mt-5 block text-sm font-medium text-slate-700" for="reset-confirm-password">
            Confirm password
          </label>
          <input
            id="reset-confirm-password"
            v-model="form.confirmPassword"
            class="mt-2 block w-full rounded-md border px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            :class="fieldError('confirmPassword') ? 'border-red-300' : 'border-slate-300'"
            type="password"
            autocomplete="new-password"
            @blur="touched.confirmPassword = true"
          />
          <p v-if="fieldError('confirmPassword')" class="mt-1 text-xs text-red-600">
            {{ fieldError("confirmPassword") }}
          </p>

          <button
            class="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Resetting password..." : "Reset password" }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
