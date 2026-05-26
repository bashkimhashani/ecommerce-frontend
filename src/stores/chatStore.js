import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function createSessionId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: [],
    sessionId: localStorage.getItem("chatSessionId") || createSessionId(),
    isLoading: false,
    isHistoryLoading: false,
    error: "",
  }),
  actions: {
    async loadHistory() {
      if (!this.sessionId || this.isHistoryLoading || this.messages.length > 0) {
        return;
      }

      this.isHistoryLoading = true;
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chat/history/${this.sessionId}/`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !Array.isArray(data.messages)) {
          return;
        }

        this.messages = data.messages.map((message) => ({
          role: message.role,
          content: message.content,
          products: Array.isArray(message.products) ? message.products : [],
        }));
      } finally {
        this.isHistoryLoading = false;
      }
    },
    async sendMessage(content) {
      const message = content.trim();
      const authStore = useAuthStore();

      if (!message || this.isLoading) {
        return;
      }

      this.error = "";
      this.isLoading = true;
      this.messages.push({ role: "user", content: message });
      localStorage.setItem("chatSessionId", this.sessionId);

      try {
        const headers = {
          "Content-Type": "application/json",
        };

        if (authStore.accessToken) {
          headers.Authorization = `Bearer ${authStore.accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/chat/message/`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message,
            session_id: this.sessionId,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "Could not send your message.");
        }

        this.sessionId = data.session_id || this.sessionId;
        localStorage.setItem("chatSessionId", this.sessionId);
        this.messages.push({
          role: "assistant",
          content: data.message,
          usedFallback: Boolean(data.used_fallback),
          products: Array.isArray(data.products) ? data.products : [],
        });
      } catch (error) {
        this.error = error.message || "Could not send your message.";
        this.messages.push({
          role: "assistant",
          content: this.error,
          usedFallback: true,
          products: [],
        });
      } finally {
        this.isLoading = false;
      }
    },
    clearChat() {
      this.messages = [];
      this.error = "";
      this.sessionId = createSessionId();
      localStorage.setItem("chatSessionId", this.sessionId);
    },
  },
});
