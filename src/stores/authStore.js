import { defineStore } from "pinia";

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function getInitialUser() {
  return readJson("currentUser");
}

function getInitialAccessToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken") || localStorage.getItem("refresh") || "";
}

function getUserRole(user) {
  return user?.role || localStorage.getItem("role") || "";
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const useAuthStore = defineStore("auth", {
  state: () => {
    const user = getInitialUser();
    const accessToken = getInitialAccessToken();

    return {
      user,
      accessToken,
      role: getUserRole(user),
      isAuthenticated: Boolean(accessToken),
    };
  },
  actions: {
    setSession(payload) {
      const user = payload?.user || null;
      const accessToken = payload?.access || payload?.accessToken || "";
      const refreshToken = payload?.refresh || payload?.refreshToken || "";
      const role = payload?.role || user?.role || "";

      this.user = user;
      this.accessToken = accessToken;
      this.role = role;
      this.isAuthenticated = Boolean(accessToken);

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("access", accessToken);
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access");
      }

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("refresh", refreshToken);
      }

      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
      } else {
        localStorage.removeItem("currentUser");
      }

      if (role) {
        localStorage.setItem("role", role);
      } else {
        localStorage.removeItem("role");
      }
    },
    updateUser(user) {
      this.user = user || null;
      this.role = user ? getUserRole(user) : "";

      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
      } else {
        localStorage.removeItem("currentUser");
      }

      if (this.role) {
        localStorage.setItem("role", this.role);
      } else {
        localStorage.removeItem("role");
      }
    },
    setAccessToken(accessToken) {
      this.accessToken = accessToken || "";
      this.isAuthenticated = Boolean(accessToken);

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("access", accessToken);
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access");
      }
    },
    async refreshSession() {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        this.clearSession();
        return false;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.access) {
          this.clearSession();
          return false;
        }

        this.setAccessToken(payload.access);
        return true;
      } catch {
        this.clearSession();
        return false;
      }
    },
    async authenticatedFetch(url, options = {}) {
      const headers = new Headers(options.headers || {});

      if (this.accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${this.accessToken}`);
      }

      let response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status !== 401) {
        return response;
      }

      const refreshed = await this.refreshSession();
      if (!refreshed) {
        return response;
      }

      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${this.accessToken}`);

      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });

      return response;
    },
    clearSession() {
      this.user = null;
      this.accessToken = "";
      this.role = "";
      this.isAuthenticated = false;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("role");
    },
  },
});
