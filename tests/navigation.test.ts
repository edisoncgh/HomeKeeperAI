import { describe, expect, it } from "vitest";
import { getActiveNavigationItem, navigationItems } from "@/lib/navigation";

describe("navigationItems", () => {
  it("exposes stable application navigation entries", () => {
    expect(navigationItems).toEqual([
      expect.objectContaining({ id: "overview", href: "/", label: "总览" }),
      expect.objectContaining({ id: "items", href: "/items", label: "物品" }),
      expect.objectContaining({ id: "alerts", href: "/alerts", label: "预警" }),
      expect.objectContaining({ id: "stats", href: "/stats", label: "统计" }),
      expect.objectContaining({ id: "categories", href: "/categories", label: "分类" }),
      expect.objectContaining({ id: "locations", href: "/locations", label: "位置" }),
      expect.objectContaining({ id: "settings", href: "/settings", label: "设置" }),
      expect.objectContaining({ id: "ui", href: "/ui", label: "组件" })
    ]);
  });
});

describe("getActiveNavigationItem", () => {
  it("matches the current route by exact route or nested route prefix", () => {
    expect(getActiveNavigationItem("/")).toMatchObject({ id: "overview" });
    expect(getActiveNavigationItem("/items")).toMatchObject({ id: "items" });
    expect(getActiveNavigationItem("/items/3")).toMatchObject({ id: "items" });
    expect(getActiveNavigationItem("/alerts")).toMatchObject({ id: "alerts" });
    expect(getActiveNavigationItem("/alerts/3")).toMatchObject({ id: "alerts" });
    expect(getActiveNavigationItem("/stats")).toMatchObject({ id: "stats" });
    expect(getActiveNavigationItem("/stats/detail")).toMatchObject({ id: "stats" });
    expect(getActiveNavigationItem("/categories")).toMatchObject({ id: "categories" });
    expect(getActiveNavigationItem("/locations/3")).toMatchObject({ id: "locations" });
    expect(getActiveNavigationItem("/settings")).toMatchObject({ id: "settings" });
    expect(getActiveNavigationItem("/ui")).toMatchObject({ id: "ui" });
    expect(getActiveNavigationItem("/ui/buttons")).toMatchObject({ id: "ui" });
  });

  it("falls back to overview for unknown routes", () => {
    expect(getActiveNavigationItem("/unknown")).toMatchObject({ id: "overview" });
  });
});
