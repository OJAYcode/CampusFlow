import type { Role } from "@/src/lib/constants";

export function canAccessRole(requiredRole: Exclude<Role, "super_admin">, actualRole?: Role | null) {
  if (!actualRole) return false;
  if (requiredRole === "admin" && actualRole === "super_admin") return true;
  return requiredRole === actualRole;
}
