import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildAiCandidateConfirmations,
  confirmAiCandidateItem,
  type AiCandidateConfirmation
} from "@/lib/ai/candidate-confirmation";
import { AiCandidateConfirmationPanel } from "@/components/ai";

const categories = [{ id: 1, name: "食品" }];
const locations = [{ id: 1, name: "冰箱" }];

function buildBananaConfirmation(): AiCandidateConfirmation {
  const [confirmation] = buildAiCandidateConfirmations({
    candidates: [
      {
        categoryName: { confidence: 0.86, reason: "香蕉通常按食品管理。", source: "inference", value: "食品" },
        expiryDays: {
          confidence: 0.68,
          reason: "图片未显示保质期，按香蕉常见保存时间估计。",
          source: "inference",
          value: 7
        },
        locationName: { confidence: 0.72, reason: "适合作为冰箱或阴凉处候选。", source: "inference", value: "冰箱" },
        name: { confidence: 0.92, source: "image", value: "香蕉" },
        quantity: { confidence: 0.35, source: "image", value: 1 }
      }
    ],
    categories,
    locations,
    today: "2026-06-01",
    warnings: ["香蕉 的数量置信度较低，请人工确认。"]
  });

  return confirmation;
}

describe("confirmAiCandidateItem", () => {
  it("posts only the official item payload to the existing item API", async () => {
    const confirmation = buildBananaConfirmation();
    let postedBody = "";

    const result = await confirmAiCandidateItem(confirmation, async (_path, init) => {
      postedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ data: { item: { id: 12, name: "香蕉" } } }), { status: 201 });
    });

    expect(result).toEqual({ item: { id: 12, name: "香蕉" }, ok: true });
    expect(JSON.parse(postedBody)).toEqual({
      categoryId: 1,
      description: null,
      expiryDate: "2026-06-08",
      imageUrl: null,
      locationId: 1,
      name: "香蕉",
      notes: null,
      purchaseDate: null,
      purchasePrice: null,
      quantity: 1
    });
    expect(postedBody).not.toContain("fieldMeta");
    expect(postedBody).not.toContain("warnings");
  });

  it("returns a friendly message when the item API rejects the payload", async () => {
    const result = await confirmAiCandidateItem(buildBananaConfirmation(), async () => {
      return new Response(JSON.stringify({ message: "物品名称不能为空。" }), { status: 400 });
    });

    expect(result).toEqual({ message: "物品名称不能为空。", ok: false });
  });
});

describe("AiCandidateConfirmationPanel", () => {
  it("renders editable candidate fields, source labels, confidence and warnings", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(AiCandidateConfirmationPanel, {
        categories,
        confirmation: buildBananaConfirmation(),
        locations
      })
    );

    expect(html).toContain("香蕉");
    expect(html).toContain("图片识别");
    expect(html).toContain("AI 推断");
    expect(html).toContain("置信度 68%");
    expect(html).toContain("图片未显示保质期，按香蕉常见保存时间估计。");
    expect(html).toContain("香蕉 的数量置信度较低，请人工确认。");
    expect(html).toContain("确认入库");
    expect(html).toContain("name=\"name\"");
    expect(html).toContain("name=\"categoryId\"");
    expect(html).toContain("name=\"locationId\"");
  });
});
