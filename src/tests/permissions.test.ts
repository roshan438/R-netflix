import { describe, expect, it } from "vitest";
import { canAccessPlatform, canManageSpace } from "@/services/utils/permissions";

describe("permissions helpers", () => {
  it("allows space admins to manage their space", () => {
    expect(canManageSpace("space_admin")).toBe(true);
    expect(canManageSpace("member")).toBe(false);
  });

  it("allows only platform admins into platform routes", () => {
    expect(canAccessPlatform("super_admin")).toBe(true);
    expect(canAccessPlatform("none")).toBe(false);
  });
});
