"use client";

import { RouteGuard } from "@/src/components/auth/route-guard";
import { AppShell } from "@/src/components/layout/app-shell";
import { adminNav } from "@/src/routes/navigation";

export default function StaffAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard role="admin">
      <AppShell
        nav={adminNav}
        role="admin"
        subtitle="Academic structure, user records, approvals, and reporting."
        title="Admin Portal"
      >
        {children}
      </AppShell>
    </RouteGuard>
  );
}
