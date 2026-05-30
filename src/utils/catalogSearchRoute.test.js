import { describe, expect, it } from "vitest";

import {
  buildCatalogSearchLocation,
  readCatalogSearchQuery,
} from "./catalogSearchRoute";

describe("catalog search route helpers", () => {
  it("routes product detail searches back to the catalog", () => {
    expect(buildCatalogSearchLocation({}, "routers")).toEqual({
      name: "catalog",
      query: {
        q: "routers",
      },
    });
  });

  it("preserves existing catalog filters when changing the search query", () => {
    expect(
      buildCatalogSearchLocation(
        {
          brand: "apple",
          min_price: "500",
          q: "macbook",
        },
        "iphone"
      )
    ).toEqual({
      name: "catalog",
      query: {
        brand: "apple",
        min_price: "500",
        q: "iphone",
      },
    });
  });

  it("removes q when clearing the search", () => {
    expect(
      buildCatalogSearchLocation(
        {
          brand: "apple",
          q: "macbook",
        },
        ""
      )
    ).toEqual({
      name: "catalog",
      query: {
        brand: "apple",
      },
    });
  });

  it("reads only string route search values", () => {
    expect(readCatalogSearchQuery({ q: "laptop" })).toBe("laptop");
    expect(readCatalogSearchQuery({ q: ["laptop"] })).toBe("");
    expect(readCatalogSearchQuery({})).toBe("");
  });
});
