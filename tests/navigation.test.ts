import { describe, expect, it } from "vitest";
import { getActiveNavigationItem, navigationItems } from "@/lib/navigation";

describe("navigationItems", () => {
  it("exposes stable application navigation entries", () => {
    expect(navigationItems).toEqual([
      expect.objectContaining({ id: "overview", href: "/", label: "总览" }),
      expect.objectContaining({ id: "ui", href: "/ui", label: "组件" })
    ]);
  });
});

describe("getActiveNavigationItem", () => {
  it("matches the current route by exact route or nested route prefix", () => {
    expect(getActiveNavigationItem("/")).toMatchObject({ id: "overview" });
    expect(getActiveNavigationItem("/ui")).toMatchObject({ id: "ui" });
    expect(getActiveNavigationItem("/ui/buttons")).toMatchObject({ id: "ui" });
  });

  it("falls back to overview for unknown routes", () => {
    expect(getActiveNavigationItem("/unknown")).toMatchObject({ id: "overview" });
  });
});
