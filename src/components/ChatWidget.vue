<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'

const authStore = useAuthStore()
const chatStore = useChatStore()
const isOpen = ref(false)
const draft = ref('')
const messageList = ref(null)
const canChat = computed(() => authStore.isAuthenticated && authStore.role === 'customer')

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
</script>

<template>
  <div v-if="canChat" class="fixed bottom-6 right-6 z-50">
    <section
      v-if="isOpen"
      class="mb-3 flex h-[32rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
      aria-label="AI shopping assistant"
    >
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-950">Shopping assistant</h2>
          <p class="text-xs text-slate-500">AI-generated estimate based on catalog data</p>
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
          Ask about laptops, phones, accessories, or product comparisons.
        </div>
        <div
          v-for="(message, index) in chatStore.messages"
          :key="`${message.role}-${index}`"
          class="flex"
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
