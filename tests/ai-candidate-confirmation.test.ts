import { describe, expect, it } from "vitest";
import type { AiItemCandidate } from "@/lib/ai/schemas";
import {
  applyUserCandidateEdit,
  buildAiCandidateConfirmations,
  buildAiConfirmedItemPayload,
  confirmAiCandidateItem
} from "@/lib/ai/candidate-confirmation";

const categories = [
  { id: 1, name: "食品" },
  { id: 2, name: "日用品" }
];

const locations = [
  { id: 1, name: "冰箱" },
  { id: 2, name: "储物间" }
];

describe("buildAiCandidateConfirmations", () => {
  it("maps AI candidate fields into editable item forms with source metadata", () => {
    const candidate: AiItemCandidate = {
      categoryName: { confidence: 0.86, reason: "香蕉通常按食品管理。", source: "inference", value: "食品" },
      expiryDays: {
        confidence: 0.68,
        reason: "图片未显示保质期，按香蕉常见保存时间估计。",
        source: "inference",
        value: 7
      },
      locationName: { confidence: 0.72, reason: "香蕉适合放在冰箱或阴凉处。", source: "inference", value: "冰箱" },
      name: { confidence: 0.92, source: "image", value: "香蕉" },
      purchaseDate: { confidence: 0.8, source: "user", value: "2026-06-02" },
      quantity: { confidence: 0.62, source: "image", value: 1 },
      specification: { confidence: 0.7, source: "image", value: "约一串" },
      unit: { confidence: 0.62, source: "image", value: "串" }
    };

    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [candidate],
      categories,
      locations,
      today: "2026-06-01",
      warnings: ["香蕉 的数量置信度较低，请人工确认。"]
    });

    expect(confirmation.form).toMatchObject({
      categoryId: "1",
      expiryDate: "2026-06-09",
      locationId: "1",
      name: "香蕉",
      purchaseDate: "2026-06-02",
      quantity: "1",
      specification: "约一串",
      unit: "串"
    });
    expect(confirmation.fieldMeta.expiryDate).toMatchObject({
      confidence: 0.68,
      reason: "图片未显示保质期，按香蕉常见保存时间估计。",
      source: "inference"
    });
    expect(confirmation.fieldMeta.categoryId?.label).toBe("食品");
    expect(confirmation.warnings).toContain("香蕉 的数量置信度较低，请人工确认。");
  });

  it("keeps unmatched category and location editable and warns the user", () => {
    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [
        {
          categoryName: { confidence: 0.7, reason: "按物品语义推断。", source: "inference", value: "零食" },
          locationName: { confidence: 0.66, reason: "按物品语义推断。", source: "inference", value: "餐边柜" },
          name: { confidence: 0.9, source: "order", value: "饼干" }
        }
      ],
      categories,
      locations,
      today: "2026-06-01",
      warnings: []
    });

    expect(confirmation.form.categoryId).toBe("");
    expect(confirmation.form.locationId).toBe("");
    expect(confirmation.warnings).toEqual([
      "饼干 的候选分类“零食”未匹配到现有分类，请手动选择。",
      "饼干 的候选位置“餐边柜”未匹配到现有位置，请手动选择。"
    ]);
  });
});

describe("applyUserCandidateEdit", () => {
  it("marks edited fields as user sourced metadata", () => {
    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [{ name: { confidence: 0.9, source: "image", value: "牛奶" } }],
      categories,
      locations,
      today: "2026-06-01",
      warnings: []
    });

    const edited = applyUserCandidateEdit(confirmation, "quantity", "2");

    expect(edited.form.quantity).toBe("2");
    expect(edited.fieldMeta.quantity).toEqual({
      confidence: 1,
      label: "2",
      reason: "用户在确认界面修改或补充。",
      source: "user"
    });
  });
});

describe("buildAiConfirmedItemPayload", () => {
  it("returns the official item API payload without AI metadata", () => {
    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [
        {
          name: { confidence: 0.92, source: "image", value: "牛奶" },
          purchasePrice: { confidence: 0.88, source: "order", value: 18.9 },
          quantity: { confidence: 0.8, source: "order", value: 2 },
          specification: { confidence: 0.82, source: "order", value: "500ML" },
          unit: { confidence: 0.8, source: "order", value: "盒" }
        }
      ],
      categories,
      locations,
      today: "2026-06-01",
      warnings: []
    });

    expect(buildAiConfirmedItemPayload(confirmation)).toEqual({
      categoryId: null,
      description: null,
      expiryDate: null,
      imageUrl: null,
      locationId: null,
      name: "牛奶",
      notes: null,
      purchaseDate: null,
      purchasePrice: 18.9,
      quantity: 2,
      specification: "500ML",
      unit: "盒"
    });
  });
});

describe("confirmAiCandidateItem image attachment", () => {
  it("uploads the source image after the confirmed item is created", async () => {
    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [{ name: { confidence: 0.92, source: "image", value: "牛奶" } }],
      categories,
      locations,
      today: "2026-06-01",
      warnings: []
    });
    const file = new File(["image"], "milk.jpg", { type: "image/jpeg" });
    const calls: string[] = [];

    const result = await import("@/lib/ai/candidate-confirmation").then(({ confirmAiCandidateItem }) =>
      confirmAiCandidateItem(
        confirmation,
        async (path, init) => {
          calls.push(String(path));
          if (path === "/api/items") {
            return new Response(JSON.stringify({ data: { item: { id: 12, name: "牛奶" } } }), { status: 201 });
          }
          if (path === "/api/items/12/images") {
            expect(init?.body).toBeInstanceOf(FormData);
            expect((init?.body as FormData).get("file")).toBe(file);
            return new Response(JSON.stringify({ data: { id: 1 } }), { status: 201 });
          }
          return new Response(JSON.stringify({ data: { item: { id: 12, images: [{ id: 1 }], name: "牛奶" } } }), {
            status: 200
          });
        },
        { imageFile: file }
      )
    );

    expect(result).toEqual({
      item: { id: 12, images: [{ id: 1 }], name: "牛奶" },
      ok: true,
      warning: "候选已写入物品，图片已保存。"
    });
    expect(calls).toEqual(["/api/items", "/api/items/12/images", "/api/items/12"]);
  });

  it("keeps the created item when source image upload throws", async () => {
    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [{ name: { confidence: 0.92, source: "image", value: "牛奶" } }],
      categories,
      locations,
      today: "2026-06-01",
      warnings: []
    });
    const file = new File(["image"], "milk.jpg", { type: "image/jpeg" });

    const result = await confirmAiCandidateItem(
      confirmation,
      async (path) => {
        if (path === "/api/items") {
          return new Response(JSON.stringify({ data: { item: { id: 12, name: "牛奶" } } }), { status: 201 });
        }
        throw new Error("network failed");
      },
      { imageFile: file }
    );

    expect(result).toEqual({
      item: { id: 12, name: "牛奶" },
      ok: true,
      warning: "候选已写入物品，但图片保存失败；可在物品详情中重新上传。"
    });
  });

  it("keeps the created item when refreshing after image upload throws", async () => {
    const [confirmation] = buildAiCandidateConfirmations({
      candidates: [{ name: { confidence: 0.92, source: "image", value: "牛奶" } }],
      categories,
      locations,
      today: "2026-06-01",
      warnings: []
    });
    const file = new File(["image"], "milk.jpg", { type: "image/jpeg" });

    const result = await confirmAiCandidateItem(
      confirmation,
      async (path) => {
        if (path === "/api/items") {
          return new Response(JSON.stringify({ data: { item: { id: 12, name: "牛奶" } } }), { status: 201 });
        }
        if (path === "/api/items/12/images") {
          return new Response(JSON.stringify({ data: { id: 1 } }), { status: 201 });
        }
        throw new Error("refresh failed");
      },
      { imageFile: file }
    );

    expect(result).toEqual({
      item: { id: 12, name: "牛奶" },
      ok: true,
      warning: "候选已写入物品，图片已保存；详情刷新失败，请稍后重新打开物品。"
    });
  });
});
