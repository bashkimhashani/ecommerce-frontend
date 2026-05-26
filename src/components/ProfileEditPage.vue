<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "../stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const authStore = useAuthStore();

const form = reactive({
  firstName: "",
  lastName: "",
  phone: "",
});
const initialProfile = reactive({
  firstName: "",
  lastName: "",
  phone: "",
});

const profile = ref(null);
const avatarFile = ref(null);
const avatarPreviewUrl = ref("");
const avatarInput = ref(null);
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const fieldErrors = reactive({});

const avatarUrl = computed(
  () => avatarPreviewUrl.value || profile.value?.avatar_thumbnail || profile.value?.avatar || ""
);
const initials = computed(() => {
  const firstInitial = form.firstName.trim().charAt(0);
  const lastInitial = form.lastName.trim().charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
});
const hasChanges = computed(
  () =>
    form.firstName.trim() !== initialProfile.firstName ||
    form.lastName.trim() !== initialProfile.lastName ||
    form.phone.trim() !== initialProfile.phone ||
    Boolean(avatarFile.value)
);
const canSave = computed(
  () =>
    hasChanges.value &&
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    !isSaving.value &&
    !isLoading.value
);
const saveIndicator = computed(() => {
  if (isSaving.value) {
    return "Saving...";
  }
  if (successMessage.value) {
    return "Saved";
  }
  if (hasChanges.value) {
    return "Unsaved changes";
  }
  return "Up to date";
});
const saveIndicatorClass = computed(() => {
  if (isSaving.value) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (successMessage.value) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (hasChanges.value) {
    return "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
});

function authorizationHeaders() {
  return authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {};
}

function setFormFromUser(user) {
  profile.value = user;
  form.firstName = user?.first_name || "";
  form.lastName = user?.last_name || "";
  form.phone = user?.phone || "";
  initialProfile.firstName = form.firstName.trim();
  initialProfile.lastName = form.lastName.trim();
  initialProfile.phone = form.phone.trim();
}

function parseProfileError(payload) {
  const fields = ["first_name", "last_name", "phone", "avatar", "non_field_errors"];

  for (const field of fields) {
    if (payload?.[field]?.length) {
      return payload[field][0];
    }
  }

  return payload?.detail || "Could not save your profile right now.";
}

function applyFieldErrors(payload) {
  clearFieldErrors();

  const fieldMap = {
    first_name: "firstName",
    last_name: "lastName",
    phone: "phone",
    avatar: "avatar",
  };

  Object.entries(fieldMap).forEach(([apiField, localField]) => {
    if (payload?.[apiField]?.length) {
      fieldErrors[localField] = payload[apiField][0];
    }
  });
}

function clearFieldErrors() {
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key];
  });
}

function clearAvatarPreview() {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = "";
  }
}

async function loadProfile() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me/`, {
      headers: {
        ...authorizationHeaders(),
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.detail || "Could not load your profile.");
    }

    setFormFromUser(payload);
    authStore.updateUser(payload);
  } catch (error) {
    errorMessage.value = error.message || "Could not load your profile.";
  } finally {
    isLoading.value = false;
  }
}

function chooseAvatar() {
  avatarInput.value?.click();
}

function handleAvatarChange(event) {
  const [file] = event.target.files || [];
  fieldErrors.avatar = "";
  successMessage.value = "";

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    fieldErrors.avatar = "Choose an image file.";
    event.target.value = "";
    return;
  }

  if (file.size > MAX_AVATAR_SIZE) {
    fieldErrors.avatar = "Choose an image under 5 MB.";
    event.target.value = "";
    return;
  }

  clearAvatarPreview();
  avatarFile.value = file;
  avatarPreviewUrl.value = URL.createObjectURL(file);
}

async function saveProfile() {
  errorMessage.value = "";
  successMessage.value = "";
  clearFieldErrors();

  if (!form.firstName.trim() || !form.lastName.trim()) {
    errorMessage.value = "First name and last name are required.";
    return;
  }

  isSaving.value = true;

  try {
    const data = new FormData();
    data.append("first_name", form.firstName.trim());
    data.append("last_name", form.lastName.trim());
    data.append("phone", form.phone.trim());

    if (avatarFile.value) {
      data.append("avatar", avatarFile.value);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/users/me/`, {
      method: "PATCH",
      headers: {
        ...authorizationHeaders(),
      },
      body: data,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      applyFieldErrors(payload);
      throw new Error(parseProfileError(payload));
    }

    clearAvatarPreview();
    avatarFile.value = null;
    if (avatarInput.value) {
      avatarInput.value.value = "";
    }
    setFormFromUser(payload);
    authStore.updateUser(payload);
    successMessage.value = "Profile saved.";
  } catch (error) {
    errorMessage.value = error.message || "Could not save your profile right now.";
  } finally {
    isSaving.value = false;
  }
}

watch(
  () => [form.firstName, form.lastName, form.phone, avatarFile.value],
  () => {
    if (successMessage.value && !isSaving.value && hasChanges.value) {
      successMessage.value = "";
    }
  }
);

onMounted(loadProfile);
onBeforeUnmount(clearAvatarPreview);
</script>

<template>
  <main
    class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
  >
    <section
      class="bg-white px-5 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-8 lg:px-12"
    >
      <div
        class="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-700 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700 dark:text-emerald-300">
            Account profile
          </p>
          <h1 class="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            Edit your profile
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Keep your contact details and profile photo current across Vendora.
          </p>
        </div>

        <div
          class="inline-flex h-9 w-max items-center rounded-full border px-3 text-sm font-semibold"
          :class="saveIndicatorClass"
          role="status"
          aria-live="polite"
        >
          {{ saveIndicator }}
        </div>
      </div>

      <div
        v-if="isLoading"
        class="mt-8 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        Loading profile...
      </div>

      <form
        v-else
        class="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]"
        @submit.prevent="saveProfile"
      >
        <aside class="border-r border-slate-200 pr-0 dark:border-slate-700 lg:pr-8">
          <div class="flex flex-col items-start gap-5">
            <div
              class="relative h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
            >
              <img v-if="avatarUrl" class="h-full w-full object-cover" :src="avatarUrl" alt="" />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-slate-950 text-3xl font-semibold text-white dark:bg-slate-100 dark:text-slate-950"
                aria-hidden="true"
              >
                {{ initials }}
              </div>
            </div>

            <div>
              <input
                ref="avatarInput"
                class="sr-only"
                type="file"
                accept="image/*"
                @change="handleAvatarChange"
              />
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-300 dark:hover:text-white"
                @click="chooseAvatar"
              >
                Upload avatar
              </button>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                JPG, PNG, or WebP under 5 MB.
              </p>
              <p v-if="fieldErrors.avatar" class="mt-2 text-sm text-red-600 dark:text-red-300">
                {{ fieldErrors.avatar }}
              </p>
            </div>
          </div>
        </aside>

        <div class="max-w-2xl">
          <div
            v-if="errorMessage"
            class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {{ errorMessage }}
          </div>

          <div class="mt-0 grid gap-5 sm:grid-cols-2" :class="errorMessage ? 'mt-6' : ''">
            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-200"
                for="profile-first-name"
              >
                First name
              </label>
              <input
                id="profile-first-name"
                v-model="form.firstName"
                class="mt-2 block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-300"
                :class="
                  fieldErrors.firstName
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-300 dark:border-slate-700'
                "
                type="text"
                autocomplete="given-name"
                required
              />
              <p v-if="fieldErrors.firstName" class="mt-1 text-xs text-red-600 dark:text-red-300">
                {{ fieldErrors.firstName }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-200"
                for="profile-last-name"
              >
                Last name
              </label>
              <input
                id="profile-last-name"
                v-model="form.lastName"
                class="mt-2 block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-300"
                :class="
                  fieldErrors.lastName
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-300 dark:border-slate-700'
                "
                type="text"
                autocomplete="family-name"
                required
              />
              <p v-if="fieldErrors.lastName" class="mt-1 text-xs text-red-600 dark:text-red-300">
                {{ fieldErrors.lastName }}
              </p>
            </div>
          </div>

          <label
            class="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            for="profile-email"
          >
            Email
          </label>
          <input
            id="profile-email"
            class="mt-2 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            type="email"
            :value="profile?.email || ''"
            autocomplete="email"
            disabled
          />

          <label
            class="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            for="profile-phone"
          >
            Phone
          </label>
          <input
            id="profile-phone"
            v-model="form.phone"
            class="mt-2 block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-300"
            :class="
              fieldErrors.phone
                ? 'border-red-300 dark:border-red-700'
                : 'border-slate-300 dark:border-slate-700'
            "
            type="tel"
            autocomplete="tel"
            placeholder="+1 555 0100"
          />
          <p v-if="fieldErrors.phone" class="mt-1 text-xs text-red-600 dark:text-red-300">
            {{ fieldErrors.phone }}
          </p>

          <div
            class="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:items-center"
          >
            <button
              class="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              type="submit"
              :disabled="!canSave"
            >
              {{ isSaving ? "Saving..." : "Save changes" }}
            </button>
            <p class="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
              {{
                successMessage ||
                (hasChanges ? "Review your changes before saving." : "No changes pending.")
              }}
            </p>
          </div>
        </div>
      </form>
    </section>
  </main>
</template>
