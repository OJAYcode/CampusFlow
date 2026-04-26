"use client";

import { RouteGuard } from "@/src/components/auth/route-guard";
import { AppShell } from "@/src/components/layout/app-shell";
import { studentNav } from "@/src/routes/navigation";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard role="student">
      <AppShell
        nav={studentNav}
        role="student"
        subtitle="Courses, assignments, attendance, and academic updates."
        title="Student Portal"
      >
        {children}
      </AppShell>
    </RouteGuard>
  );
}
