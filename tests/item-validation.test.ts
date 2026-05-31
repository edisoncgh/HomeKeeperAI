import { describe, expect, it } from "vitest";
import { parseItemInput, parseItemQuery } from "@/lib/validation/item";

describe("item input validation", () => {
  it("normalizes valid item input", () => {
    expect(
      parseItemInput({
        categoryId: 1,
        description: "  低温鲜牛奶  ",
        expiryDate: "2026-06-15",
        imageUrl: "  https://example.test/milk.jpg  ",
        locationId: 2,
        name: "  牛奶  ",
        notes: "  优先饮用  ",
        purchaseDate: "2026-05-31",
        purchasePrice: 18.9,
        quantity: 2
      })
    ).toEqual({
      data: {
        categoryId: 1,
        description: "低温鲜牛奶",
        expiryDate: new Date("2026-06-15T00:00:00.000Z"),
        imageUrl: "https://example.test/milk.jpg",
        locationId: 2,
        name: "牛奶",
        notes: "优先饮用",
        purchaseDate: new Date("2026-05-31T00:00:00.000Z"),
        purchasePrice: 18.9,
        quantity: 2
      },
      ok: true
    });
  });

  it("defaults quantity and converts empty optional fields to null", () => {
    expect(parseItemInput({ description: "", name: "纸巾", notes: " " })).toEqual({
      data: {
        categoryId: null,
        description: null,
        expiryDate: null,
        imageUrl: null,
        locationId: null,
        name: "纸巾",
        notes: null,
        purchaseDate: null,
        purchasePrice: null,
        quantity: 1
      },
      ok: true
    });
  });

  it("rejects invalid core fields", () => {
    expect(parseItemInput({ name: "" })).toMatchObject({ message: "物品名称不能为空。", ok: false });
    expect(parseItemInput({ name: "牛奶", quantity: 0 })).toMatchObject({
      message: "数量必须是大于等于 1 的整数。",
      ok: false
    });
    expect(parseItemInput({ expiryDate: "not-date", name: "牛奶" })).toMatchObject({
      message: "保质期格式不正确。",
      ok: false
    });
    expect(parseItemInput({ name: "牛奶", purchasePrice: -1 })).toMatchObject({
      message: "采购价格不能小于 0。",
      ok: false
    });
    expect(parseItemInput({ categoryId: "x", name: "牛奶" })).toMatchObject({
      message: "分类参数不正确。",
      ok: false
    });
    expect(parseItemInput({ locationId: -1, name: "牛奶" })).toMatchObject({
      message: "位置参数不正确。",
      ok: false
    });
  });
});

describe("item query validation", () => {
  it("normalizes list query params", () => {
    const query = new URLSearchParams({
      categoryId: "1",
      locationId: "2",
      order: "asc",
      page: "2",
      pageSize: "30",
      q: " 牛奶 ",
      sort: "name",
      status: "NORMAL"
    });

    expect(parseItemQuery(query)).toEqual({
      data: {
        categoryId: 1,
        locationId: 2,
        order: "asc",
        page: 2,
        pageSize: 30,
        q: "牛奶",
        sort: "name",
        status: "NORMAL"
      },
      ok: true
    });
  });

  it("uses stable query defaults and rejects invalid filters", () => {
    expect(parseItemQuery(new URLSearchParams())).toMatchObject({
      data: { order: "desc", page: 1, pageSize: 20, sort: "updatedAt" },
      ok: true
    });
    expect(parseItemQuery(new URLSearchParams({ categoryId: "x" }))).toMatchObject({
      message: "分类筛选参数不正确。",
      ok: false
    });
    expect(parseItemQuery(new URLSearchParams({ status: "bad" }))).toMatchObject({
      message: "状态筛选参数不正确。",
      ok: false
    });
  });
});
