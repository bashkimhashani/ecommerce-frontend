import { describe, expect, it } from "vitest";

import { resolveCheckoutAccess } from "./checkoutAccess";

describe("resolveCheckoutAccess", () => {
  it("sends guests to login with the current page as redirect", () => {
    expect(
      resolveCheckoutAccess({
        isAuthenticated: false,
        redirectPath: "/products/apple-macbook-air-13-m3",
        role: "guest",
      })
    ).toEqual({
      allowed: false,
      route: {
        name: "login",
        query: { redirect: "/products/apple-macbook-air-13-m3" },
      },
    });
  });

  it("does not allow vendor roles to enter customer checkout", () => {
    expect(
      resolveCheckoutAccess({
        isAuthenticated: true,
        redirectPath: "/",
        role: "vendor_admin",
      })
    ).toEqual({
      allowed: false,
      route: { name: "catalog" },
    });
  });

  it("allows authenticated customers to enter checkout", () => {
    expect(
      resolveCheckoutAccess({
        isAuthenticated: true,
        redirectPath: "/",
        role: "customer",
      })
    ).toEqual({ allowed: true });
  });
});
