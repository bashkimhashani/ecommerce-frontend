<script setup>
import { nextTick, ref, watch } from 'vue'
import { useChatStore } from '../stores/chatStore'

const chatStore = useChatStore()
const emit = defineEmits(['view-product'])
const isOpen = ref(false)
const draft = ref('')
const messageList = ref(null)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  },
)

async function sendMessage() {
  const message = draft.value
  draft.value = ''
  await chatStore.sendMessage(message)
}

function imageUrl(product) {
  if (!product.thumbnail) {
    return ''
  }
  if (product.thumbnail.startsWith('http')) {
    return product.thumbnail
  }
  return `${apiBaseUrl}${product.thumbnail}`
}

function viewProduct(product) {
  if (!product.slug) {
    return
  }
  isOpen.value = false
  emit('view-product', product.slug)
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <section
      v-if="isOpen"
      class="mb-3 flex h-[32rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
      aria-label="AI shopping assistant"
    >
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-950">Shopping assistant</h2>
          <p class="text-xs text-slate-500">Helper bot for this tech store</p>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-950"
          aria-label="Close chat"
          title="Close chat"
          @click="isOpen = false"
        >
          x
        </button>
      </header>

      <div ref="messageList" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        <div v-if="chatStore.messages.length === 0" class="rounded border border-slate-200 bg-white p-3 text-sm text-slate-600">
          Hi, I am Vendora Assistant. Ask me about products, comparisons, shopping, login, cart, checkout, or selling here.
        </div>
        <div
          v-for="(message, index) in chatStore.messages"
          :key="`${message.role}-${index}`"
          class="flex flex-col"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <p
            class="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6"
            :class="message.role === 'user'
              ? 'bg-slate-950 text-white'
              : 'border border-slate-200 bg-white text-slate-700'"
          >
            {{ message.content }}
          </p>
          <div
            v-if="message.role === 'assistant' && message.products?.length"
            class="mt-2 grid gap-2"
          >
            <button
              v-for="product in message.products"
              :key="product.id"
              type="button"
              class="grid w-[17rem] max-w-full grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              @click="viewProduct(product)"
            >
              <div class="overflow-hidden rounded bg-slate-100">
                <img
                  v-if="imageUrl(product)"
                  :src="imageUrl(product)"
                  :alt="product.name"
                  class="aspect-square h-full w-full object-cover"
                  loading="lazy"
                >
                <div v-else class="flex aspect-square items-center justify-center px-2 text-center text-[11px] font-medium text-slate-400">
                  {{ product.name }}
                </div>
              </div>
              <div class="min-w-0 py-0.5">
                <p class="truncate text-sm font-semibold text-slate-950">
                  {{ product.name }}
                </p>
                <p class="mt-0.5 truncate text-xs text-slate-500">
                  {{ product.brand }} · {{ product.category }}
                </p>
                <p class="mt-1 text-sm font-semibold text-slate-900">
                  ${{ product.price }}
                </p>
              </div>
            </button>
          </div>
        </div>
        <div v-if="chatStore.isLoading" class="text-xs text-slate-500">Thinking...</div>
      </div>

      <form class="border-t border-slate-200 bg-white p-3" @submit.prevent="sendMessage">
        <div class="flex gap-2">
          <input
            v-model="draft"
            class="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Ask a shopping question"
            :disabled="chatStore.isLoading"
          >
          <button
            type="submit"
            class="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="chatStore.isLoading || !draft.trim()"
          >
            Send
          </button>
        </div>
      </form>
    </section>

    <button
      type="button"
      class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white shadow-xl hover:bg-slate-800"
      :aria-label="isOpen ? 'Close AI chat' : 'Open AI chat'"
      :title="isOpen ? 'Close AI chat' : 'Open AI chat'"
      @click="isOpen = !isOpen"
    >
      ?
    </button>
  </div>
</template>
