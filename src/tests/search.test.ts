import { describe, expect, it } from "vitest";
import { demoMediaItems } from "@/lib/demo-data";
import { filterMediaItems } from "@/services/utils/search";
import { filterByTenant } from "@/services/utils/tenant";

describe("search and tenant helpers", () => {
  it("filters media by search query", () => {
    const results = filterMediaItems(demoMediaItems, {
      query: "anniversary",
      type: "all",
    });
    expect(results.some((item) => item.id === "media_anniversary_film")).toBe(true);
  });

  it("keeps tenant results isolated", () => {
    const results = filterByTenant(demoMediaItems, "space_luna_house");
    expect(results).toHaveLength(demoMediaItems.length);
  });
});
