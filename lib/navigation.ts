export type NavigationItemId = "categories" | "items" | "locations" | "overview" | "settings" | "ui";
export type NavigationIconKey = "folder-tree" | "home" | "layout-grid" | "map-pin" | "package" | "settings";

export interface NavigationItem {
  readonly href: string;
  readonly icon: NavigationIconKey;
  readonly id: NavigationItemId;
  readonly label: string;
}

export const navigationItems: readonly NavigationItem[] = [
  {
    href: "/",
    icon: "home",
    id: "overview",
    label: "总览"
  },
  {
    href: "/items",
    icon: "package",
    id: "items",
    label: "物品"
  },
  {
    href: "/categories",
    icon: "folder-tree",
    id: "categories",
    label: "分类"
  },
  {
    href: "/locations",
    icon: "map-pin",
    id: "locations",
    label: "位置"
  },
  {
    href: "/settings",
    icon: "settings",
    id: "settings",
    label: "设置"
  },
  {
    href: "/ui",
    icon: "layout-grid",
    id: "ui",
    label: "组件"
  }
] as const;

export function getActiveNavigationItem(pathname: null | string | undefined) {
  const normalizedPathname = normalizePathname(pathname);

  return (
    navigationItems.find((item) => {
      if (item.href === "/") {
        return normalizedPathname === "/";
      }

      return normalizedPathname === item.href || normalizedPathname.startsWith(`${item.href}/`);
    }) ?? navigationItems[0]
  );
}

function normalizePathname(pathname: null | string | undefined) {
  if (!pathname) {
    return "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
