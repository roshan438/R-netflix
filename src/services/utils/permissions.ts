import type { Role } from "@/types/domain";

export function canManageSpace(role: Role | "none") {
  return role === "space_admin" || role === "super_admin";
}

export function canAccessPlatform(role: Role | "none") {
  return role === "super_admin";
}
