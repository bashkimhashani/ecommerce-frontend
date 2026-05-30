<script setup>
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../stores/authStore";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const authStore = useAuthStore();

const reviews = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

const averageRating = computed(() => {
  if (!reviews.value.length) return "0.0";
  const total = reviews.value.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return (total / reviews.value.length).toFixed(1);
});

function authHeaders() {
  return authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {};
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

async function loadReviews() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/reviews/vendor/`, {
      headers: authHeaders(),
    });
    const payload = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(payload.detail || "Could not load vendor reviews.");
    }

    reviews.value = payload;
  } catch (error) {
    errorMessage.value = error.message || "Could not load vendor reviews.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadReviews);
</script>

<template>
  <section class="mb-5 rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700"
    >
      <div>
        <h2 class="text-sm font-semibold text-slate-950 dark:text-white">Customer reviews</h2>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Feedback from customers who bought your products.
        </p>
      </div>
      <div class="text-right text-xs text-slate-500 dark:text-slate-400">
        <p>
          <span class="font-semibold text-slate-950 dark:text-white">{{ reviews.length }}</span>
          reviews
        </p>
        <p>
          <span class="font-semibold text-slate-950 dark:text-white">{{ averageRating }}</span>
          average
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="grid gap-3 p-4 md:grid-cols-2">
      <div
        v-for="item in 2"
        :key="item"
        class="h-28 animate-pulse rounded-md bg-slate-50 dark:bg-slate-800"
      ></div>
    </div>

    <p
      v-else-if="errorMessage"
      class="m-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      {{ errorMessage }}
    </p>

    <div v-else-if="!reviews.length" class="px-4 py-10 text-center">
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">No reviews yet.</p>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Reviews will appear here after customers buy and rate your products.
      </p>
    </div>

    <div v-else class="grid gap-3 p-4 lg:grid-cols-2">
      <article
        v-for="review in reviews"
        :key="review.id"
        class="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-slate-950 dark:text-white">
              {{ review.product_name }}
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ review.customer_name }} - {{ formatDate(review.created_at) }}
            </p>
          </div>
          <p class="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {{ review.rating }}/5
          </p>
        </div>
        <h3 v-if="review.title" class="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
          {{ review.title }}
        </h3>
        <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {{ review.comment }}
        </p>
      </article>
    </div>
  </section>
</template>
