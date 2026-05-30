// @vitest-environment jsdom

import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import router from "./index";
import { useAuthStore } from "../stores/authStore";

describe("router navigation guards", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    await router.replace("/");
  });

  it("redirects authenticated customers away from vendor routes", async () => {
    const authStore = useAuthStore();
    authStore.setSession({
      access: "customer-token",
      user: {
        id: 1,
        email: "customer@example.com",
        role: "customer",
      },
    });

    await router.push("/vendor");

    expect(router.currentRoute.value.name).toBe("catalog");
  });

  it("redirects authenticated vendor admins away from customer order routes", async () => {
    const authStore = useAuthStore();
    authStore.setSession({
      access: "vendor-token",
      user: {
        id: 2,
        email: "vendor@example.com",
        role: "vendor_admin",
      },
    });

    await router.push("/orders");

    expect(router.currentRoute.value.name).toBe("catalog");
  });

  it("redirects unauthenticated users to login for protected routes", async () => {
    await router.push("/orders");

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/orders");
  });

  it("allows shoppers to open the public wishlist route", async () => {
    await router.push("/wishlist");

    expect(router.currentRoute.value.name).toBe("wishlist");
    expect(router.currentRoute.value.meta.activeView).toBe("wishlist");
  });
});
