"use client";

import { ArrowLeft, ChevronRight, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { AppSidebar, type AppSidebarNavGroup } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { useAuthStore } from "@/src/store/auth-store";
import { cn } from "@/src/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

type ShellRole = "student" | "lecturer" | "admin";

function getSectionGroups(nav: NavItem[], role: ShellRole): AppSidebarNavGroup[] {
  if (role === "student") {
    return [
      { label: "Overview", items: nav.slice(0, 4) },
      { label: "Academic Activity", items: nav.slice(4) },
    ];
  }

  if (role === "lecturer") {
    return [
      { label: "Teaching", items: nav.slice(0, 4) },
      { label: "Course Delivery", items: nav.slice(4) },
    ];
  }

  return [
    { label: "Structure", items: nav.slice(0, 9) },
    { label: "Oversight", items: nav.slice(9) },
  ];
}

function getShellTheme(role: ShellRole) {
  if (role === "student") {
    return {
      portalLabel: "Student Portal",
      shortLabel: "Student",
      monogram: "ST",
      shellBackground: "bg-[var(--surface-soft)]",
      headerGlow: "bg-[radial-gradient(circle_at_top_left,rgba(37,90,200,0.18),transparent_40%)]",
    };
  }

  if (role === "lecturer") {
    return {
      portalLabel: "Lecturer Portal",
      shortLabel: "Lecturer",
      monogram: "LC",
      shellBackground: "bg-[var(--surface-soft)]",
      headerGlow: "bg-[radial-gradient(circle_at_top_left,rgba(37,90,200,0.18),transparent_40%)]",
    };
  }

  return {
    portalLabel: "Admin Portal",
    shortLabel: "Admin",
    monogram: "AD",
    shellBackground: "bg-[var(--surface-soft)]",
    headerGlow: "bg-[radial-gradient(circle_at_top_left,rgba(37,90,200,0.18),transparent_40%)]",
  };
}

export function AppShell({
  title,
  subtitle,
  nav,
  role = "student",
  children,
}: {
  title: string;
  subtitle: string;
  nav: NavItem[];
  role?: ShellRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const groups = useMemo(() => getSectionGroups(nav, role), [nav, role]);
  const theme = useMemo(() => getShellTheme(role), [role]);
  const currentNavItem = useMemo(
    () => [...nav].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
    [nav, pathname],
  );
  const currentLabel = currentNavItem?.label || title;
  const homeHref = nav[0]?.href || "/";
  const canGoBack = pathname !== homeHref;
  const currentRoleLabel = user?.role
    ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
    : theme.shortLabel;

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "12.5rem",
          "--sidebar-width-mobile": "13.75rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        groups={groups}
        homeHref={homeHref}
        monogram={theme.monogram}
        portalName={theme.portalLabel}
        portalDescription={subtitle}
        roleLabel={currentRoleLabel}
        userName={user?.fullName}
        userSecondary={user?.email}
        onLogout={logout}
      />

      <SidebarInset className={cn("min-h-svh shadow-none md:rounded-none", theme.shellBackground)}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48">
          <div className={cn("absolute inset-0", theme.headerGlow)} />
        </div>

        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(246,248,252,0.92)] backdrop-blur-xl">
          <div className="relative flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white shadow-sm hover:bg-[#f5f7fb] md:hidden" />
                {canGoBack ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl px-2.5 sm:px-3"
                    onClick={() => {
                      if (window.history.length > 1) {
                        router.back();
                        return;
                      }

                      router.push(homeHref);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                ) : null}
                <div className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[#5d6882] shadow-sm md:flex">
                  <Sparkles className="h-4 w-4 text-[#255ac8]" />
                  Unified workspace
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="info" className="rounded-full px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5">
                  {currentRoleLabel}
                </Badge>
                <Button variant="secondary" size="sm" className="rounded-xl px-2.5 sm:px-3" onClick={logout}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 overflow-hidden text-[10px] font-medium uppercase tracking-[0.16em] text-[#8b94aa] sm:text-[11px] sm:tracking-[0.18em]">
                <Link href={homeHref} className="transition hover:text-[#202c4b]">
                  {theme.shortLabel}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="truncate">{currentLabel}</span>
              </div>
              <div className="mt-2.5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-[1.28rem] font-semibold tracking-[-0.04em] text-[#202c4b] sm:text-[1.5rem] md:truncate md:text-[1.75rem]">
                    {title}
                  </h1>
                  <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#5d6882] sm:max-w-3xl sm:text-sm sm:leading-6 md:line-clamp-2 lg:line-clamp-none">{subtitle}</p>
                </div>
                <div className="self-start rounded-full border border-[rgba(37,90,200,0.14)] bg-[rgba(37,90,200,0.06)] px-2.5 py-1 text-[11px] font-medium text-[#255ac8] sm:px-3 sm:py-1.5 sm:text-xs">
                  {currentLabel}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-shell relative z-10 flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          <div className="space-y-4 sm:space-y-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
