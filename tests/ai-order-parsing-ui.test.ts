import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OrderParsingPanel } from "@/components/ai";

describe("OrderParsingPanel", () => {
  it("renders the order parsing entry and confirmation boundary", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      React.createElement(OrderParsingPanel, {
        categories: [{ id: 1, name: "食品" }],
        locations: [{ id: 2, name: "储物间" }]
      })
    );

    expect(html).toContain("AI 订单解析");
    expect(html).toContain("不会保存订单截图");
    expect(html).toContain('name="image"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('name="orderSource"');
    expect(html).toContain("解析候选");
    expect(html).toContain("也可以继续手动添加物品");
  });
});
