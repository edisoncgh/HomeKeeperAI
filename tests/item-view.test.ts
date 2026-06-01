import { describe, expect, it } from "vitest";
import {
  buildItemListSearchParams,
  buildItemPayload,
  formatDateForInput,
  formatDateTimeToMinute,
  getItemStatusMeta,
  parseItemListFilters,
  type ItemFormState
} from "@/lib/inventory/item-view";

describe("formatDateForInput", () => {
  it("converts serialized dates to yyyy-mm-dd input values", () => {
    expect(formatDateForInput("2026-06-15T00:00:00.000Z")).toBe("2026-06-15");
    expect(formatDateForInput(null)).toBe("");
  });
});

describe("formatDateTimeToMinute", () => {
  it("keeps record timestamps precise to the minute", () => {
    expect(formatDateTimeToMinute("2026-06-01T14:28:45.000Z")).toBe("2026-06-01 14:28");
    expect(formatDateTimeToMinute(null)).toBe("未记录");
  });
});

describe("buildItemPayload", () => {
  it("normalizes item form fields for the API payload", () => {
    const form: ItemFormState = {
      categoryId: "2",
      description: "  低温鲜牛奶  ",
      expiryDate: "2026-06-15",
      imageUrl: "",
      locationId: "",
      name: "  牛奶  ",
      notes: "",
      purchaseDate: "",
      purchasePrice: "18.9",
      quantity: "3"
    };

    expect(buildItemPayload(form)).toEqual({
      categoryId: 2,
      description: "低温鲜牛奶",
      expiryDate: "2026-06-15",
      imageUrl: null,
      locationId: null,
      name: "牛奶",
      notes: null,
      purchaseDate: null,
      purchasePrice: 18.9,
      quantity: 3
    });
  });
});

describe("getItemStatusMeta", () => {
  it("returns user-facing status labels and tones", () => {
    expect(getItemStatusMeta("NORMAL")).toMatchObject({ label: "正常", tone: "success" });
    expect(getItemStatusMeta("EXPIRED")).toMatchObject({ label: "已过期", tone: "danger" });
  });
});

describe("item list filters", () => {
  it("builds compact query strings for non-default list filters", () => {
    const params = buildItemListSearchParams({
      categoryId: "2",
      locationId: "3",
      order: "asc",
      page: 2,
      pageSize: 40,
      q: "  牛奶  ",
      sort: "expiryDate",
      status: "NORMAL"
    });

    expect(params.toString()).toBe(
      "q=%E7%89%9B%E5%A5%B6&categoryId=2&locationId=3&status=NORMAL&sort=expiryDate&order=asc&page=2&pageSize=40"
    );
  });

  it("parses URL search params with safe defaults", () => {
    const filters = parseItemListFilters(
      new URLSearchParams("q=%E7%89%9B%E5%A5%B6&categoryId=2&sort=bad&page=0&pageSize=200")
    );

    expect(filters).toEqual({
      categoryId: "2",
      locationId: "",
      order: "desc",
      page: 1,
      pageSize: 20,
      q: "牛奶",
      sort: "updatedAt",
      status: ""
    });
  });
});
