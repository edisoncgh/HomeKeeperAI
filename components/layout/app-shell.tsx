"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  Camera,
  FolderTree,
  Home,
  MapPin,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings
} from "lucide-react";
import { cn } from "@/lib/class-names";
import { CameraIntakeProvider, CameraShortcutButton } from "@/components/ai";
import {
  getActiveMobileNavigationItem,
  getActiveNavigationItem,
  mobileNavigationItems,
  navigationItems,
  type NavigationIconKey,
  type NavigationItem
} from "@/lib/navigation";

interface AppShellProps {
  children: ReactNode;
}

type NavigationPlacement = "bottom" | "sidebar";
const PHOTO_NAV_ITEM_ID = "photo";

const iconMap: Record<NavigationIconKey, typeof Home> = {
  "bar-chart-3": BarChart3,
  bell: Bell,
  camera: Camera,
  "folder-tree": FolderTree,
  home: Home,
  "map-pin": MapPin,
  package: Package,
  settings: Settings
};

export function AppShell({ children }: AppShellProps) {
  return (
    <CameraIntakeProvider>
      <AppShellContent>{children}</AppShellContent>
    </CameraIntakeProvider>
  );
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavigationItem(pathname);
  const fallbackMobileItem = getActiveMobileNavigationItem(pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthPage = pathname === "/login" || pathname === "/setup";

  if (isAuthPage) {
    return <main className="min-h-[100dvh] bg-app-background px-4 py-6">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-app-background text-text-primary">
      <MobileHeader />
      <DesktopSidebar
        activeItem={activeItem}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <ShellMain isSidebarCollapsed={isSidebarCollapsed}>{children}</ShellMain>
      <Suspense fallback={<MobileBottomNavigation activeItem={fallbackMobileItem} />}>
        <MobileBottomNavigationWithSearchParams pathname={pathname} />
      </Suspense>
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-soft-border bg-surface/95 px-4 backdrop-blur md:hidden">
      <Menu aria-hidden className="text-primary" size={20} />
      <span className="text-sm font-semibold">家庭仓储</span>
    </header>
  );
}

function DesktopSidebar({
  activeItem,
  isCollapsed,
  setIsCollapsed
}: {
  activeItem: NavigationItem;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((current: boolean) => boolean)) => void;
}) {
  return (
    <aside className={getSidebarClassName(isCollapsed)}>
      <SidebarHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <SidebarNavigation activeItem={activeItem} isCollapsed={isCollapsed} />
      <SidebarExpandButton isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    </aside>
  );
}

function SidebarHeader({
  isCollapsed,
  setIsCollapsed
}: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((current: boolean) => boolean)) => void;
}) {
  return (
    <div className="flex h-16 items-center justify-between gap-2 border-b border-soft-border px-4">
      <Link
        aria-label="家庭仓储总览"
        className="flex min-w-0 items-center gap-3 rounded-card text-sm font-semibold"
        href="/"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-card bg-primary text-white">
          <Home aria-hidden size={18} />
        </span>
        <span className={cn("truncate", isCollapsed && "md:sr-only")}>家庭仓储</span>
      </Link>
      <button
        aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        className={cn(getIconButtonClassName("size-9"), isCollapsed && "md:hidden")}
        onClick={() => setIsCollapsed((value) => !value)}
        type="button"
      >
        <PanelLeftClose aria-hidden size={18} />
      </button>
    </div>
  );
}

function SidebarNavigation({
  activeItem,
  isCollapsed
}: {
  activeItem: NavigationItem;
  isCollapsed: boolean;
}) {
  return (
    <nav aria-label="主导航" className="flex flex-1 flex-col gap-1 p-3">
      {navigationItems.map((item) => (
        <NavigationLink
          isActive={activeItem.id === item.id}
          isCollapsed={isCollapsed}
          item={item}
          key={item.id}
          placement="sidebar"
        />
      ))}
    </nav>
  );
}

function SidebarExpandButton({
  isCollapsed,
  setIsCollapsed
}: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}) {
  if (!isCollapsed) {
    return null;
  }

  return (
    <div className="border-t border-soft-border p-3">
      <button
        aria-label="展开侧边栏"
        className={getIconButtonClassName("size-11")}
        onClick={() => setIsCollapsed(false)}
        type="button"
      >
        <PanelLeftOpen aria-hidden size={18} />
      </button>
    </div>
  );
}

function ShellMain({
  children,
  isSidebarCollapsed
}: {
  children: ReactNode;
  isSidebarCollapsed: boolean;
}) {
  return (
    <main
      className={cn(
        "min-h-[calc(100vh-56px)] px-4 pb-24 pt-5 sm:px-6 md:min-h-screen md:pb-8 md:pt-6 lg:px-8",
        isSidebarCollapsed ? "md:pl-[96px]" : "md:pl-[280px]"
      )}
    >
      {children}
    </main>
  );
}

function MobileBottomNavigation({ activeItem }: { activeItem: NavigationItem }) {
  return (
    <nav
      aria-label="底部导航"
      className="fixed inset-x-0 bottom-0 z-30 grid h-16 auto-cols-fr grid-flow-col border-t border-soft-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(51,51,51,0.08)] backdrop-blur md:hidden"
    >
      {mobileNavigationItems.map((item) => (
        <NavigationLink isActive={activeItem.id === item.id} item={item} key={item.id} placement="bottom" />
      ))}
    </nav>
  );
}

function MobileBottomNavigationWithSearchParams({ pathname }: { pathname: null | string }) {
  const searchParams = useSearchParams();
  const pathWithQuery = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const activeMobileItem = getActiveMobileNavigationItem(pathWithQuery);

  return <MobileBottomNavigation activeItem={activeMobileItem} />;
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
  const isPhotoAction = isBottom && item.id === PHOTO_NAV_ITEM_ID;
  const linkClassName = cn(
    "inline-flex min-h-11 items-center rounded-card font-medium transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isPhotoAction
      ? "relative -mt-6 flex-col justify-center gap-1 rounded-full bg-primary px-4 text-xs text-white shadow-lg"
      : isBottom
        ? "flex-col justify-center gap-1 px-2 text-xs"
        : "gap-3 px-3 text-sm",
    isActive && !isPhotoAction ? "bg-primary text-white shadow-sm" : "",
    isActive && isPhotoAction ? "ring-4 ring-primary-light" : "",
    !isActive && !isPhotoAction ? "text-text-secondary hover:bg-primary-light hover:text-text-primary" : "",
    isCollapsed && !isBottom ? "justify-center px-0" : ""
  );

  if (isPhotoAction) {
    return (
      <CameraShortcutButton className={linkClassName} iconSize={isBottom ? 19 : 18} label={item.label}>
        <Icon aria-hidden size={isBottom ? 19 : 18} />
        <span className="truncate">{item.label}</span>
      </CameraShortcutButton>
    );
  }

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      className={linkClassName}
      href={item.href}
    >
      <Icon aria-hidden size={isBottom ? 19 : 18} />
      <span className={cn("truncate", isCollapsed && !isBottom && "md:sr-only")}>{item.label}</span>
    </Link>
  );
}

function getSidebarClassName(isCollapsed: boolean) {
  return cn(
    "fixed inset-y-0 left-0 z-30 hidden border-r border-soft-border bg-surface/95 shadow-sm backdrop-blur md:flex md:flex-col md:transition-[width] md:duration-200",
    isCollapsed ? "md:w-[72px]" : "md:w-64"
  );
}

function getIconButtonClassName(sizeClassName: string) {
  return cn(
    "grid shrink-0 place-items-center rounded-card text-text-secondary transition hover:bg-primary-light hover:text-text-primary",
    sizeClassName
  );
}
