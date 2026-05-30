"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/class-names";
import {
  getActiveNavigationItem,
  navigationItems,
  type NavigationIconKey,
  type NavigationItem
} from "@/lib/navigation";

interface AppShellProps {
  children: ReactNode;
}

type NavigationPlacement = "bottom" | "sidebar";

const iconMap: Record<NavigationIconKey, typeof Home> = {
  home: Home,
  "layout-grid": LayoutGrid
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavigationItem(pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthPage = pathname === "/login" || pathname === "/setup";

  if (isAuthPage) {
    return <main className="min-h-[100dvh] bg-app-background px-4 py-6">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-app-background text-text-primary">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-soft-border bg-surface/95 px-4 backdrop-blur md:hidden">
        <Menu aria-hidden className="text-primary" size={20} />
        <span className="text-sm font-semibold">家庭仓储</span>
      </header>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-soft-border bg-surface/95 shadow-sm backdrop-blur md:flex md:flex-col md:transition-[width] md:duration-200",
          isSidebarCollapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-soft-border px-4">
          <Link
            aria-label="家庭仓储总览"
            className="flex min-w-0 items-center gap-3 rounded-card text-sm font-semibold"
            href="/"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-card bg-primary text-white">
              <Home aria-hidden size={18} />
            </span>
            <span className={cn("truncate", isSidebarCollapsed && "md:sr-only")}>家庭仓储</span>
          </Link>
          <button
            aria-label={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-card text-text-secondary transition hover:bg-primary-light hover:text-text-primary",
              isSidebarCollapsed && "md:hidden"
            )}
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            type="button"
          >
            <PanelLeftClose aria-hidden size={18} />
          </button>
        </div>

        <nav aria-label="主导航" className="flex flex-1 flex-col gap-1 p-3">
          {navigationItems.map((item) => (
            <NavigationLink
              isActive={activeItem.id === item.id}
              isCollapsed={isSidebarCollapsed}
              item={item}
              key={item.id}
              placement="sidebar"
            />
          ))}
        </nav>

        {isSidebarCollapsed ? (
          <div className="border-t border-soft-border p-3">
            <button
              aria-label="展开侧边栏"
              className="grid size-11 place-items-center rounded-card text-text-secondary transition hover:bg-primary-light hover:text-text-primary"
              onClick={() => setIsSidebarCollapsed(false)}
              type="button"
            >
              <PanelLeftOpen aria-hidden size={18} />
            </button>
          </div>
        ) : null}
      </aside>

      <main
        className={cn(
          "min-h-[calc(100vh-56px)] px-4 pb-24 pt-5 sm:px-6 md:min-h-screen md:pb-8 md:pt-6 lg:px-8",
          isSidebarCollapsed ? "md:pl-[96px]" : "md:pl-[280px]"
        )}
      >
        {children}
      </main>

      <nav
        aria-label="底部导航"
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-2 border-t border-soft-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(51,51,51,0.08)] backdrop-blur md:hidden"
      >
        {navigationItems.map((item) => (
          <NavigationLink
            isActive={activeItem.id === item.id}
            item={item}
            key={item.id}
            placement="bottom"
          />
        ))}
      </nav>
    </div>
  );
}

function NavigationLink({
  isActive,
  isCollapsed = false,
  item,
  placement
}: {
  isActive: boolean;
  isCollapsed?: boolean;
  item: NavigationItem;
  placement: NavigationPlacement;
}) {
  const Icon = iconMap[item.icon];
  const isBottom = placement === "bottom";

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-card font-medium transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        isActive ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-primary-light",
        isActive ? "" : "hover:text-text-primary",
        isBottom ? "flex-col justify-center gap-1 px-2 text-xs" : "gap-3 px-3 text-sm",
        isCollapsed && !isBottom ? "justify-center px-0" : ""
      )}
      href={item.href}
    >
      <Icon aria-hidden size={isBottom ? 19 : 18} />
      <span className={cn("truncate", isCollapsed && !isBottom && "md:sr-only")}>{item.label}</span>
    </Link>
  );
}
