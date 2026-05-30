import { describe, expect, it } from "vitest";

import { shouldShowAppChrome } from "./appChrome";

describe("shouldShowAppChrome", () => {
  it("shows navigation and cart controls on public catalog pages", () => {
    expect(shouldShowAppChrome("catalog", false)).toBe(true);
    expect(shouldShowAppChrome("product-detail", false)).toBe(true);
  });

  it("hides navigation on auth pages", () => {
    expect(shouldShowAppChrome("login", false)).toBe(false);
    expect(shouldShowAppChrome("register", true)).toBe(false);
  });

  it("shows navigation on protected app pages after authentication", () => {
    expect(shouldShowAppChrome("orders", true)).toBe(true);
    expect(shouldShowAppChrome("vendor", true)).toBe(true);
  });

  it("hides protected app chrome for signed-out protected pages", () => {
    expect(shouldShowAppChrome("orders", false)).toBe(false);
    expect(shouldShowAppChrome("vendor", false)).toBe(false);
  });
});
