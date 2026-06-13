import { describe, expect, it } from "vitest";
import {
  getActiveMobileNavigationItem,
  getActiveNavigationItem,
  mobileNavigationItems,
  navigationItems
} from "@/lib/navigation";

describe("navigationItems", () => {
  it("exposes formal application navigation without the component demo page", () => {
    expect(navigationItems.map((item) => item.id)).toEqual([
      "overview",
      "items",
      "alerts",
      "stats",
      "categories",
      "locations",
      "settings"
    ]);
    expect(navigationItems.some((item) => item.href === "/ui")).toBe(false);
  });
});

describe("mobileNavigationItems", () => {
  it("keeps mobile navigation focused on daily-use destinations", () => {
    expect(mobileNavigationItems.map((item) => item.id)).toEqual([
      "overview",
      "items",
      "photo",
      "alerts",
      "settings"
    ]);
    expect(mobileNavigationItems).toHaveLength(5);
    expect(mobileNavigationItems.find((item) => item.id === "photo")).toMatchObject({
      href: "/items?mode=camera"
    });
  });
});

describe("getActiveNavigationItem", () => {
  it("matches formal routes and falls back for removed demo routes", () => {
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
    expect(getActiveNavigationItem("/ui")).toMatchObject({ id: "overview" });
    expect(getActiveNavigationItem("/ui/buttons")).toMatchObject({ id: "overview" });
  });

  it("falls back to overview for unknown routes", () => {
    expect(getActiveNavigationItem("/unknown")).toMatchObject({ id: "overview" });
  });
});

describe("getActiveMobileNavigationItem", () => {
  it("maps secondary mobile routes to the closest primary destination", () => {
    expect(getActiveMobileNavigationItem("/")).toMatchObject({ id: "overview" });
    expect(getActiveMobileNavigationItem("/items")).toMatchObject({ id: "items" });
    expect(getActiveMobileNavigationItem("/items/3")).toMatchObject({ id: "items" });
    expect(getActiveMobileNavigationItem("/items?mode=camera")).toMatchObject({ id: "photo" });
    expect(getActiveMobileNavigationItem("/items?mode=photo")).toMatchObject({ id: "photo" });
    expect(getActiveMobileNavigationItem("/alerts")).toMatchObject({ id: "alerts" });
    expect(getActiveMobileNavigationItem("/stats")).toMatchObject({ id: "overview" });
    expect(getActiveMobileNavigationItem("/stats/detail")).toMatchObject({ id: "overview" });
    expect(getActiveMobileNavigationItem("/categories")).toMatchObject({ id: "settings" });
    expect(getActiveMobileNavigationItem("/locations/3")).toMatchObject({ id: "settings" });
    expect(getActiveMobileNavigationItem("/settings")).toMatchObject({ id: "settings" });
    expect(getActiveMobileNavigationItem("/ui")).toMatchObject({ id: "overview" });
  });
});
