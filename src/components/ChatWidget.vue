<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import aiAvatar from "../assets/images/ai-assistant-avatar.svg";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";

const chatStore = useChatStore();
const authStore = useAuthStore();
const emit = defineEmits(["view-product"]);
const isOpen = ref(false);
const draft = ref("");
const messageList = ref(null);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const userAvatar = computed(() => authStore.user?.avatar_thumbnail || authStore.user?.avatar || "");
const userInitials = computed(() => {
  const firstInitial = authStore.user?.first_name?.charAt(0) || "";
  const lastInitial = authStore.user?.last_name?.charAt(0) || "";
  return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
});

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick();
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  }
);

onMounted(() => {
  chatStore.loadHistory();
});

async function sendMessage() {
  const message = draft.value;
  draft.value = "";
  await chatStore.sendMessage(message);
}

function mediaUrl(url) {
  if (!url) {
    return "";
  }
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `${apiBaseUrl}${url}`;
}

function imageUrl(product) {
  return mediaUrl(product.thumbnail);
}

function viewProduct(product) {
  if (!product.slug) {
    return;
  }
  isOpen.value = false;
  emit("view-product", product.slug);
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <Transition name="page-fade">
      <section
        v-if="isOpen"
        class="mb-3 flex h-[32rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
        aria-label="AI shopping assistant"
      >
        <header
          class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
        >
          <div class="flex items-center gap-3">
            <img
              class="h-9 w-9 rounded-full border border-slate-200 bg-slate-950 dark:border-slate-700"
              :src="aiAvatar"
              alt=""
            />
            <div>
              <h2 class="text-sm font-semibold text-slate-950 dark:text-white">
                Shopping assistant
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Helper bot for this tech store
              </p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
            aria-label="Close chat"
            title="Close chat"
            @click="isOpen = false"
          >
            x
          </button>
        </header>

        <div
          ref="messageList"
          class="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900"
        >
          <div
            v-if="chatStore.messages.length === 0"
            class="rounded border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
          >
            Hi, I am Vendora Assistant. Ask me about products, comparisons, shopping, login, cart,
            checkout, or selling here.
          </div>
          <div
            v-for="(message, index) in chatStore.messages"
            :key="`${message.role}-${index}`"
            class="flex gap-2"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <img
              v-if="message.role === 'assistant'"
              class="mt-1 h-8 w-8 shrink-0 rounded-full border border-slate-200 bg-slate-950 dark:border-slate-700"
              :src="aiAvatar"
              alt=""
            />
            <div
              v-else
              class="order-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <img
                v-if="userAvatar"
                class="h-full w-full object-cover"
                :src="mediaUrl(userAvatar)"
                alt=""
              />
              <span v-else>{{ userInitials }}</span>
            </div>

            <div
              class="flex min-w-0 max-w-[85%] flex-col"
              :class="message.role === 'user' ? 'items-end' : 'items-start'"
            >
              <p
                class="rounded-lg px-3 py-2 text-sm leading-6"
                :class="
                  message.role === 'user'
                    ? 'bg-slate-950 text-white dark:bg-sky-500 dark:text-slate-950'
                    : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                "
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
                  class="grid w-[17rem] max-w-full grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                  @click="viewProduct(product)"
                >
                  <div class="overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                    <img
                      v-if="imageUrl(product)"
                      :src="imageUrl(product)"
                      :alt="product.name"
                      class="aspect-square h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div
                      v-else
                      class="flex aspect-square items-center justify-center px-2 text-center text-[11px] font-medium text-slate-400"
                    >
                      {{ product.name }}
                    </div>
                  </div>
                  <div class="min-w-0 py-0.5">
                    <p class="truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {{ product.name }}
                    </p>
                    <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {{ product.brand }} &middot; {{ product.category }}
                    </p>
                    <p class="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      ${{ product.price }}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div v-if="chatStore.isLoading" class="text-xs text-slate-500 dark:text-slate-400">
            Thinking...
          </div>
        </div>

        <form
          class="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
          @submit.prevent="sendMessage"
        >
          <div class="flex gap-2">
            <input
              v-model="draft"
              class="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-400"
              placeholder="Ask a shopping question"
              :disabled="chatStore.isLoading"
            />
            <button
              type="submit"
              class="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-sky-500 dark:text-slate-950 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              :disabled="chatStore.isLoading || !draft.trim()"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </Transition>

    <button
      type="button"
      class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white shadow-xl hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
      :aria-label="isOpen ? 'Close AI chat' : 'Open AI chat'"
      :title="isOpen ? 'Close AI chat' : 'Open AI chat'"
      @click="isOpen = !isOpen"
    >
      ?
    </button>
  </div>
</template>
