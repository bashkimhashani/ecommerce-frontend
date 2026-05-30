<script setup>
import { onMounted, reactive, ref } from "vue";
import { useAuthStore } from "../stores/authStore";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const authStore = useAuthStore();

const items = ref([]);
const drafts = reactive({});
const isLoading = ref(false);
const savingItemId = ref(null);
const errorMessage = ref("");

function authHeaders() {
  return authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {};
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Recent purchase";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function ensureDraft(item) {
  if (drafts[item.order_item_id]) {
    return;
  }

  drafts[item.order_item_id] = {
    rating: item.existing_review?.rating || 5,
    title: item.existing_review?.title || "",
    comment: item.existing_review?.comment || "",
    status: "",
    error: "",
  };
}

async function loadPurchasedItems() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/reviews/purchased-items/`, {
      headers: authHeaders(),
    });
    const payload = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(payload.detail || "Could not load your purchases.");
    }

    items.value = payload;
    items.value.forEach(ensureDraft);
  } catch (error) {
    errorMessage.value = error.message || "Could not load your purchases.";
  } finally {
    isLoading.value = false;
  }
}

async function submitReview(item) {
  ensureDraft(item);
  const draft = drafts[item.order_item_id];
  draft.status = "";
  draft.error = "";

  if (!draft.comment.trim()) {
    draft.error = "Write a short review before submitting.";
    return;
  }

  savingItemId.value = item.order_item_id;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        order_item: item.order_item_id,
        rating: Number(draft.rating),
        title: draft.title.trim(),
        comment: draft.comment.trim(),
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.detail || "Could not save your review.");
    }

    item.existing_review = payload;
    draft.status = "Review saved.";
  } catch (error) {
    draft.error = error.message || "Could not save your review.";
  } finally {
    savingItemId.value = null;
  }
}

onMounted(loadPurchasedItems);
</script>

<template>
  <section
    class="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800"
    >
      <div>
        <h2 class="text-base font-semibold text-slate-950 dark:text-white">Purchased items</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review products you have already bought from Vendora vendors.
        </p>
      </div>
      <button
        type="button"
        class="h-9 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        @click="loadPurchasedItems"
      >
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="grid gap-3 p-4 md:grid-cols-2">
      <div
        v-for="item in 2"
        :key="item"
        class="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
      ></div>
    </div>

    <p
      v-else-if="errorMessage"
      class="m-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      {{ errorMessage }}
    </p>

    <div v-else-if="!items.length" class="px-4 py-12 text-center">
      <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">No purchases yet.</p>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Bought products will appear here as cards after checkout.
      </p>
    </div>

    <div v-else class="grid gap-4 p-4 xl:grid-cols-2">
      <article
        v-for="item in items"
        :key="item.order_item_id"
        class="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[150px_minmax(0,1fr)]"
      >
        <div
          class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-white dark:bg-slate-900"
        >
          <img
            v-if="item.product_thumbnail"
            :src="item.product_thumbnail"
            :alt="item.product_name"
            class="h-full w-full object-contain p-2"
          />
          <span v-else class="px-3 text-center text-sm font-semibold text-slate-500">
            {{ item.product_name }}
          </span>
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="line-clamp-2 text-sm font-bold text-slate-950 dark:text-white">
                {{ item.product_name }}
              </h3>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ item.vendor_name }} · {{ item.order_number }} · {{ formatDate(item.purchased_at) }}
              </p>
            </div>
            <p class="text-sm font-bold text-emerald-600 dark:text-emerald-300">
              {{ formatPrice(item.line_total) }}
            </p>
          </div>

          <form class="mt-3 grid gap-2" @submit.prevent="submitReview(item)">
            <div class="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
              <select
                v-model="drafts[item.order_item_id].rating"
                class="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option v-for="rating in 5" :key="rating" :value="rating">
                  {{ rating }} star
                </option>
              </select>
              <input
                v-model="drafts[item.order_item_id].title"
                class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Review title"
              />
            </div>

            <textarea
              v-model="drafts[item.order_item_id].comment"
              class="min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Tell the vendor how the product worked for you"
            ></textarea>

            <div class="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                class="h-9 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300"
                :disabled="savingItemId === item.order_item_id"
              >
                {{ item.existing_review ? "Update review" : "Send review" }}
              </button>
              <p
                v-if="drafts[item.order_item_id].status"
                class="text-sm font-medium text-emerald-700 dark:text-emerald-300"
              >
                {{ drafts[item.order_item_id].status }}
              </p>
              <p
                v-if="drafts[item.order_item_id].error"
                class="text-sm font-medium text-red-600 dark:text-red-300"
              >
                {{ drafts[item.order_item_id].error }}
              </p>
            </div>
          </form>
        </div>
      </article>
    </div>
  </section>
</template>
