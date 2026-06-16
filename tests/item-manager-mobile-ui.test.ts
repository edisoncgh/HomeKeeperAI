import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemManager, type ItemView } from "@/components/inventory";
import { defaultItemListFilters } from "@/lib/inventory/item-view";

describe("ItemManager mobile UI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an explicit mobile detail sheet affordance for selected items", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(ItemManager, buildProps()));

    expect(html).toContain("查看详情");
    expect(html).toContain("移动端物品详情");
    expect(html).toContain("关闭详情");
  });

  it("renders compact mobile filter controls before the full desktop filter form", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(ItemManager, buildProps()));

    expect(html).toContain("筛选条件");
    expect(html).toContain("展开筛选");
    expect(html).toContain("当前筛选");
    expect(html).toContain("全部物品");
  });

  it("renders unit, specification, and the enhanced expiry date picker affordance", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(ItemManager, buildProps()));
    const formHtml = renderToStaticMarkup(createElement(ItemManager, buildProps({ initialItems: [] })));

    expect(html).toContain("数量单位");
    expect(html).toContain("规格");
    expect(html).toContain("2 桶");
    expect(html).toContain("3L");
    expect(formHtml).toContain("快速选择年份");
    expect(formHtml).toContain("选择年份");
  });
});

function buildProps(overrides: Partial<ReturnType<typeof buildBaseProps>> = {}) {
  return { ...buildBaseProps(), ...overrides };
}

function buildBaseProps() {
  return {
    categories: [{ color: null, icon: "🥛", id: 1, name: "食品" }],
    initialFilters: defaultItemListFilters,
    initialItems: [buildItem()],
    initialPagination: { page: 1, pageCount: 1, pageSize: 20, total: 1 },
    locations: [{ color: null, icon: "❄️", id: 1, name: "冰箱" }]
  };
}

function buildItem(): ItemView {
  return {
    category: { color: null, icon: "🥛", id: 1, name: "食品" },
    categoryId: 1,
    createdAt: "2026-06-13T00:00:00.000Z",
    description: "低温鲜牛奶",
    expiryDate: "2026-06-20T00:00:00.000Z",
    id: 1,
    imageUrl: null,
    images: [],
    location: { color: null, icon: "❄️", id: 1, name: "冰箱" },
    locationId: 1,
    name: "牛奶",
    notes: "早餐优先喝",
    purchaseDate: "2026-06-12T00:00:00.000Z",
    purchasePrice: 18.9,
    quantity: 2,
    records: [],
    specification: "3L",
    status: "NORMAL",
    unit: "桶",
    updatedAt: "2026-06-13T00:00:00.000Z"
  };
}
