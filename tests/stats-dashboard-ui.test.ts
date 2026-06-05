import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StatsDashboard } from "@/components/stats/stats-dashboard";

describe("StatsDashboard", () => {
  it("renders overview numbers and taxonomy distributions", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(StatsDashboard, {
        distribution: {
          categories: [{ color: "#4FBF8F", icon: "🍎", id: 1, itemCount: 3, name: "食品", quantity: 8 }],
          locations: [{ color: "#7AA7FF", icon: "❄️", id: 2, itemCount: 2, name: "冰箱", quantity: 5 }],
          uncategorized: { itemCount: 1, quantity: 2 },
          unlocated: { itemCount: 1, quantity: 1 }
        },
        overview: {
          alerts: { expired: 1, expiring: 2, lowStock: 1, pending: 4 },
          status: { expired: 1, expiring: 2, lowStock: 1, normal: 6 },
          totals: { categories: 4, items: 10, locations: 3, quantity: 24 }
        }
      })
    );

    expect(html).toContain("统计视图");
    expect(html).toContain("10");
    expect(html).toContain("24");
    expect(html).toContain("4 条待处理");
    expect(html).toContain("分类分布");
    expect(html).toContain("食品");
    expect(html).toContain("未分类");
    expect(html).toContain("位置分布");
    expect(html).toContain("冰箱");
    expect(html).toContain("未设置位置");
  });

  it("renders a friendly empty state", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(StatsDashboard, {
        distribution: {
          categories: [],
          locations: [],
          uncategorized: { itemCount: 0, quantity: 0 },
          unlocated: { itemCount: 0, quantity: 0 }
        },
        overview: {
          alerts: { expired: 0, expiring: 0, lowStock: 0, pending: 0 },
          status: { expired: 0, expiring: 0, lowStock: 0, normal: 0 },
          totals: { categories: 0, items: 0, locations: 0, quantity: 0 }
        }
      })
    );

    expect(html).toContain("还没有可统计的物品");
    expect(html).toContain("href=\"/items\"");
    expect(html).toContain("添加物品");
  });
});
