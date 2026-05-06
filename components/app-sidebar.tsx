"use client";

/* eslint-disable simple-import-sort/imports */
import { LogOut, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type SidebarIcon = React.ComponentType<{ className?: string }>;

export interface AppSidebarNavItem {
  label: string;
  href: string;
  icon: SidebarIcon;
}

export interface AppSidebarNavGroup {
  label: string;
  items: AppSidebarNavItem[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: AppSidebarNavGroup[];
  homeHref: string;
  monogram: string;
  portalName: string;
  portalDescription: string;
  roleLabel: string;
  userName?: string;
  userSecondary?: string;
  onLogout?: () => void | Promise<void>;
}

export function AppSidebar({
  groups,
  homeHref,
  monogram,
  portalName,
  portalDescription,
  roleLabel,
  userName,
  userSecondary,
  onLogout,
  className,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();

  const isActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      variant="inset"
      className={cn(
        "border-r border-sidebar-border/80 bg-sidebar md:sticky md:top-0 md:h-svh md:self-start md:overflow-hidden",
        className,
      )}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={portalName} className="h-auto min-h-12 rounded-2xl px-3 py-2">
              <Link href={homeHref}>
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <span className="text-[11px] font-semibold tracking-[0.16em]">{monogram}</span>
                </div>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/55">
                    CampusFlow
                  </span>
                  <span className="truncate text-sm font-semibold text-sidebar-foreground">{portalName}</span>
                  <span className="line-clamp-1 text-[11px] text-sidebar-foreground/68">
                    {portalDescription}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-3">
            <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "h-10 rounded-xl px-3 text-[13px] font-medium md:h-9",
                          active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className={cn("size-4", active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={userName || roleLabel} className="h-auto min-h-12 rounded-xl px-3 py-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
                <User2 className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                  {userName || "Authenticated user"}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/65">
                  {userSecondary || roleLabel}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {onLogout ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  void onLogout();
                }}
                tooltip="Logout"
                className="h-10 rounded-xl px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="size-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
