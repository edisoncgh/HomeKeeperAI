import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AlertDashboard, type AlertDashboardData } from "@/components/alerts/alert-dashboard";

const initialData: AlertDashboardData = {
  alerts: [
    {
      createdAt: "2026-06-04T00:00:00.000Z",
      id: 11,
      item: {
        category: { color: "#4FBF8F", icon: "apple", id: 1, name: "食品" },
        expiryDate: "2026-06-01T00:00:00.000Z",
        id: 7,
        location: { color: "#5B8DEF", icon: "snowflake", id: 2, name: "冰箱" },
        name: "牛奶",
        quantity: 2,
        status: "EXPIRED"
      },
      itemId: 7,
      status: "PENDING",
      type: "EXPIRED"
    },
    {
      createdAt: "2026-06-04T00:00:00.000Z",
      id: 12,
      item: {
        category: null,
        expiryDate: null,
        id: 8,
        location: null,
        name: "纸巾",
        quantity: 1,
        status: "LOW_STOCK"
      },
      itemId: 8,
      status: "PENDING",
      type: "LOW_STOCK"
    }
  ],
  pagination: { page: 1, pageCount: 1, pageSize: 20, total: 2 },
  summary: { expired: 1, expiring: 1, lowStock: 1, pending: 3, resolved: 2 }
};

describe("AlertDashboard", () => {
  it("renders summary, filters, alert fields and resolve actions", () => {
    vi.stubGlobal("React", React);
    vi.setSystemTime(new Date("2026-06-04T08:00:00+08:00"));

    const html = renderToStaticMarkup(
      createElement(AlertDashboard, {
        initialData,
        initialFilter: "all"
      })
    );

    expect(html).toContain("预警中心");
    expect(html).toContain("待处理");
    expect(html).toContain("3");
    expect(html).toContain("已过期");
    expect(html).toContain("临期");
    expect(html).toContain("库存不足");
    expect(html).toContain("已处理");
    expect(html).toContain("牛奶");
    expect(html).toContain("食品");
    expect(html).toContain("冰箱");
    expect(html).toContain("2 件");
    expect(html).toContain("保质期 2026-06-01");
    expect(html).toContain("已过期 3 天");
    expect(html).toContain("纸巾");
    expect(html).toContain("未分类");
    expect(html).toContain("未设置");
    expect(html).toContain("标记已处理");
  });

  it("renders empty state links back to item workflows", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(AlertDashboard, {
        initialData: { ...initialData, alerts: [], pagination: { page: 1, pageCount: 0, pageSize: 20, total: 0 } },
        initialFilter: "all"
      })
    );

    expect(html).toContain("当前没有需要处理的预警");
    expect(html).toContain("href=\"/items\"");
    expect(html).toContain("查看物品");
    expect(html).toContain("添加物品");
  });
});
