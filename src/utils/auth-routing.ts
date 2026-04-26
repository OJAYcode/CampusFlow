type Role = "student" | "lecturer" | "admin" | "super_admin";

const LOGIN_ROUTES: Record<Role, string> = {
  student: "/login/student",
  lecturer: "/login/lecturer",
  admin: "/login/admin",
  super_admin: "/login/admin",
};

function canAccessRole(requiredRole: Exclude<Role, "super_admin">, actualRole: Role) {
  if (actualRole === "super_admin") return true;
  return requiredRole === actualRole;
}

function getContextAwareLoginRoute(pathname?: string | null) {
  if (!pathname) return LOGIN_ROUTES.student;
  if (pathname.startsWith("/staff/admin") || pathname.startsWith("/login/admin")) return LOGIN_ROUTES.admin;
  if (pathname.startsWith("/staff/lecturer") || pathname.startsWith("/login/lecturer")) return LOGIN_ROUTES.lecturer;
  return LOGIN_ROUTES.student;
}

export function getSessionExpiredRedirect(pathname?: string | null) {
  return getContextAwareLoginRoute(pathname);
}

export function getLogoutRedirect(role: Role | null, pathname?: string | null) {
  return role ? LOGIN_ROUTES[role] : getContextAwareLoginRoute(pathname);
}

export function getRouteGuardRedirect({
  requiredRole,
  isAuthenticated,
  isBootstrapping,
  userRole,
}: {
  requiredRole: Exclude<Role, "super_admin">;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  userRole?: Role | null;
}) {
  if (isBootstrapping) return null;
  if (!isAuthenticated || !userRole) return LOGIN_ROUTES[requiredRole];
  if (!canAccessRole(requiredRole, userRole)) return "/unauthorized";
  return null;
}
