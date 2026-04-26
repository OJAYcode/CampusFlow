"use client";

import { RouteGuard } from "@/src/components/auth/route-guard";
import { AppShell } from "@/src/components/layout/app-shell";
import { lecturerNav } from "@/src/routes/navigation";

export default function StaffLecturerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard role="lecturer">
      <AppShell
        nav={lecturerNav}
        role="lecturer"
        subtitle="Course management, attendance, assessments, and class communication."
        title="Lecturer Portal"
      >
        {children}
      </AppShell>
    </RouteGuard>
  );
}
