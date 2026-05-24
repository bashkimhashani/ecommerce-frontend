<script setup>
import { ref } from 'vue'

const props = defineProps({
  authToken: {
    type: String,
    default: '',
  },
})

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const question = ref('')
const answer = ref('')
const error = ref('')
const isLoading = ref(false)

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(props.authToken ? { Authorization: `Bearer ${props.authToken}` } : {}),
  }
}

async function askQuestion() {
  const nextQuestion = question.value.trim()

  if (!nextQuestion || isLoading.value) {
    return
  }

  isLoading.value = true
  error.value = ''
  answer.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vendor/analytics/ask/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ question: nextQuestion }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.detail || 'Could not answer that analytics question.')
    }

    answer.value = payload.answer || 'No answer returned.'
  } catch (askError) {
    error.value = askError.message || 'Could not answer that analytics question.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="rounded-md border border-slate-200 bg-white">
    <div class="border-b border-slate-200 px-4 py-3">
      <h2 class="text-sm font-semibold text-slate-950">Ask Analytics</h2>
      <p class="mt-1 text-xs text-slate-500">AI-generated estimate based on your store data</p>
    </div>

    <form class="space-y-3 p-4" @submit.prevent="askQuestion">
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          v-model="question"
          class="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-500"
          placeholder="Ask about revenue, order count, items sold, or top products"
        >
        <button
          type="submit"
          class="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="isLoading || !question.trim()"
        >
          {{ isLoading ? 'Asking' : 'Ask' }}
        </button>
      </div>

      <p
        v-if="error"
        class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
      >
        {{ error }}
      </p>

      <div v-if="answer" class="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p class="text-sm leading-6 text-slate-700">{{ answer }}</p>
        <p class="mt-2 text-xs text-slate-500">
          AI-generated estimate based on your store data
        </p>
      </div>
    </form>
  </section>
</template>
