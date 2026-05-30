import { describe, expect, it } from "vitest";

import { buildJsonRequestOptions } from "./apiRequest";

describe("buildJsonRequestOptions", () => {
  it("preserves auth and JSON headers when custom request headers are provided", () => {
    const options = buildJsonRequestOptions(
      {
        method: "POST",
        headers: {
          "Idempotency-Key": "checkout-key",
        },
        body: JSON.stringify({}),
      },
      {
        Authorization: "Bearer customer-token",
      }
    );

    expect(options).toMatchObject({
      method: "POST",
      credentials: "include",
      body: "{}",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer customer-token",
        "Idempotency-Key": "checkout-key",
      },
    });
  });
});
