/* eslint-disable simple-import-sort/imports */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { type Role } from "@/src/lib/constants";
import { useAuthStore } from "@/src/store/auth-store";
import { getRouteGuardRedirect } from "@/src/utils/auth-routing";
import { canAccessRole } from "@/src/utils/access";

export function RouteGuard({
  role,
  children,
}: {
  role: Exclude<Role, "super_admin">;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isBootstrapping, user } = useAuthStore();

  useEffect(() => {
    const redirect = getRouteGuardRedirect({
      requiredRole: role,
      isAuthenticated,
      isBootstrapping,
      userRole: user?.role,
    });

    if (redirect) {
      router.replace(redirect);
    }
  }, [isAuthenticated, isBootstrapping, pathname, role, router, user]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (!canAccessRole(role, user.role)) return null;

  return <>{children}</>;
}
