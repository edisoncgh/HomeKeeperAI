export type NavigationItemId =
  | "alerts"
  | "categories"
  | "items"
  | "locations"
  | "overview"
  | "photo"
  | "settings"
  | "stats";
export type NavigationIconKey =
  | "bar-chart-3"
  | "bell"
  | "camera"
  | "folder-tree"
  | "home"
  | "map-pin"
  | "package"
  | "settings";

export interface NavigationItem {
  readonly href: string;
  readonly icon: NavigationIconKey;
  readonly id: NavigationItemId;
  readonly label: string;
}

export const PHOTO_INTAKE_HREF = "/items?mode=camera";

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
    href: "/alerts",
    icon: "bell",
    id: "alerts",
    label: "预警"
  },
  {
    href: "/stats",
    icon: "bar-chart-3",
    id: "stats",
    label: "统计"
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
  }
] as const;

export const mobileNavigationItems: readonly NavigationItem[] = [
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
    href: PHOTO_INTAKE_HREF,
    icon: "camera",
    id: "photo",
    label: "拍照"
  },
  {
    href: "/alerts",
    icon: "bell",
    id: "alerts",
    label: "预警"
  },
  {
    href: "/settings",
    icon: "settings",
    id: "settings",
    label: "设置"
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

export function getActiveMobileNavigationItem(pathname: null | string | undefined) {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === PHOTO_INTAKE_HREF || normalizedPathname === "/items?mode=photo") {
    return findMobileNavigationItem("photo");
  }

  if (normalizedPathname === "/stats" || normalizedPathname.startsWith("/stats/")) {
    return findMobileNavigationItem("overview");
  }

  if (
    normalizedPathname === "/categories" ||
    normalizedPathname.startsWith("/categories/") ||
    normalizedPathname === "/locations" ||
    normalizedPathname.startsWith("/locations/")
  ) {
    return findMobileNavigationItem("settings");
  }

  return (
    mobileNavigationItems.find((item) => {
      const hrefPath = item.href.split("?")[0];
      if (hrefPath === "/") {
        return normalizedPathname === "/";
      }

      return normalizedPathname === hrefPath || normalizedPathname.startsWith(`${hrefPath}/`);
    }) ?? findMobileNavigationItem("overview")
  );
}

function normalizePathname(pathname: null | string | undefined) {
  if (!pathname) {
    return "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function findMobileNavigationItem(id: NavigationItemId) {
  const item = mobileNavigationItems.find((navigationItem) => navigationItem.id === id);
  if (!item) {
    throw new Error(`Missing mobile navigation item: ${id}`);
  }

  return item;
}
