<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({
  authToken: {
    type: String,
    default: "",
  },
  refreshKey: {
    type: Number,
    default: 0,
  },
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const report = ref(null);
const isLoading = ref(false);
const error = ref("");

const generatedAt = computed(() => {
  if (!report.value?.generated_at) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(report.value.generated_at));
});

function authHeaders() {
  return props.authToken ? { Authorization: `Bearer ${props.authToken}` } : {};
}

async function fetchLatestReport() {
  isLoading.value = true;
  error.value = "";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vendor/reports/latest/`, {
      headers: authHeaders(),
    });

    if (response.status === 204) {
      report.value = null;
      return;
    }

    if (!response.ok) {
      throw new Error("Could not load latest AI report.");
    }

    report.value = await response.json();
  } catch (fetchError) {
    error.value = fetchError.message || "Could not load latest AI report.";
    report.value = null;
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchLatestReport);
watch(() => [props.authToken, props.refreshKey], fetchLatestReport);
</script>

<template>
  <section
    class="rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
  >
    <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-950 dark:text-white">AI Insights</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            AI-generated estimate based on your store data
          </p>
        </div>
        <p v-if="generatedAt" class="text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ generatedAt }}
        </p>
      </div>
    </div>

    <div class="p-4">
      <div v-if="isLoading" class="space-y-3">
        <div class="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800"></div>
        <div class="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800"></div>
        <div class="h-4 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800"></div>
      </div>

      <p
        v-else-if="error"
        class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      >
        {{ error }}
      </p>

      <div v-else-if="report" class="space-y-3">
        <p class="whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
          {{ report.content }}
        </p>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          AI-generated estimate based on your store data
        </p>
      </div>

      <div v-else class="py-6 text-center">
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">No AI report yet.</p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The latest nightly report will appear here after generation.
        </p>
      </div>
    </div>
  </section>
</template>
