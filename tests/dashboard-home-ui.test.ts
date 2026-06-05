import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";

describe("HomeDashboard", () => {
  it("renders inventory overview, shortcuts, and a manual AI advice entry", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(HomeDashboard, {
        overview: {
          alertSummary: { expired: 1, expiring: 2, lowStock: 1, pending: 4, resolved: 3 },
          categoryCount: 2,
          itemCount: 5,
          latestItems: [{ id: 7, name: "牛奶", quantity: 2 }],
          locationCount: 3
        },
        user: { displayName: "Edison", role: "ADMIN", username: "edison" }
      })
    );

    expect(html).toContain("家庭仓储总览");
    expect(html).toContain("5");
    expect(html).toContain("物品");
    expect(html).toContain("AI 智能建议");
    expect(html).toContain("不会自动修改数据");
    expect(html).toContain("生成建议");
    expect(html).toContain("href=\"/items\"");
    expect(html).toContain("预警摘要");
    expect(html).toContain("4 条待处理");
    expect(html).toContain("href=\"/alerts\"");
    expect(html).toContain("牛奶");
  });
});
