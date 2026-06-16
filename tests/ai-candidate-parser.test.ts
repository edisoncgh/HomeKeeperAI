import { describe, expect, it } from "vitest";
import { parseAiCandidateResponse } from "@/lib/ai/parse";

describe("AI candidate parser", () => {
  it("parses a photo candidate with semantic default fields", () => {
    const result = parseAiCandidateResponse(
      JSON.stringify({
        candidates: [
          {
            categoryName: {
              confidence: 0.86,
              reason: "香蕉通常按食品管理。",
              source: "inference",
              value: "食品"
            },
            expiryDays: {
              confidence: 0.68,
              reason: "图片未显示保质期，按香蕉常见保存时间估计。",
              source: "inference",
              value: 7
            },
            locationName: {
              confidence: 0.72,
              reason: "香蕉需要尽快食用，可作为冰箱或阴凉处候选。",
              source: "inference",
              value: "冰箱"
            },
            name: { confidence: 0.92, source: "image", value: "香蕉" },
            quantity: { confidence: 0.62, source: "image", value: 1 },
            specification: { confidence: 0.7, source: "image", value: "约一串" },
            unit: { confidence: 0.62, source: "image", value: "串" }
          }
        ],
        warnings: []
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.candidates[0]).toMatchObject({
      expiryDays: { source: "inference", value: 7 },
      locationName: { source: "inference", value: "冰箱" },
      name: { source: "image", value: "香蕉" },
      specification: { source: "image", value: "约一串" },
      unit: { source: "image", value: "串" }
    });
  });

  it("recovers JSON from fenced responses and keeps valid candidates when another candidate is invalid", () => {
    const result = parseAiCandidateResponse(`这里是解析结果：

\`\`\`json
{
  "candidates": [
    {
      "name": { "value": "牛奶", "source": "image", "confidence": 0.91 },
      "quantity": { "value": 2, "source": "image", "confidence": 0.78 },
      "expiryDate": { "value": "2026-06-15", "source": "image", "confidence": 0.84 }
    },
    {
      "quantity": { "value": 1, "source": "image", "confidence": 0.6 }
    }
  ],
  "warnings": ["第二个物品名称不清晰。"]
}
\`\`\`
请确认。`);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.candidates).toHaveLength(1);
    expect(result.data.candidates[0].name.value).toBe("牛奶");
    expect(result.data.warnings).toEqual(
      expect.arrayContaining(["第二个物品名称不清晰。", "第 2 个候选缺少有效名称，已忽略。"])
    );
  });

  it("keeps order and user sourced fields and flags low confidence fields without dropping them", () => {
    const result = parseAiCandidateResponse({
      candidates: [
        {
          name: { confidence: 0.55, source: "order", value: "洗衣液" },
          purchaseDate: { confidence: 0.82, source: "order", value: "2026-06-02" },
          purchasePrice: { confidence: 0.38, source: "order", value: 39.9 },
          quantity: { confidence: 0.9, source: "user", value: 3 },
          specification: { confidence: 0.82, source: "order", value: "3L" },
          unit: { confidence: 0.72, source: "order", value: "桶" }
        }
      ],
      warnings: []
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.candidates[0]).toMatchObject({
      purchaseDate: { source: "order", value: "2026-06-02" },
      purchasePrice: { confidence: 0.38, source: "order", value: 39.9 },
      quantity: { source: "user", value: 3 },
      specification: { source: "order", value: "3L" },
      unit: { source: "order", value: "桶" }
    });
    expect(result.data.warnings).toContain("洗衣液 的采购价格置信度较低，请人工确认。");
  });

  it("normalizes common vision model source aliases and percentage confidence", () => {
    const result = parseAiCandidateResponse({
      candidates: [
        {
          name: { confidence: 90, source: "vision", value: "香蕉" },
          quantity: { confidence: 60, source: "visual", value: 1 }
        }
      ],
      warnings: []
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.candidates[0]).toMatchObject({
      name: { confidence: 0.9, source: "image", value: "香蕉" },
      quantity: { confidence: 0.6, source: "image", value: 1 }
    });
  });

  it("returns a friendly error for non JSON responses", () => {
    const result = parseAiCandidateResponse("我看到了香蕉，但无法形成结构化结果。");

    expect(result).toEqual({
      message: "LLM 返回内容无法解析，请重试或改为手动录入。",
      ok: false
    });
  });

  it("drops invalid inferred fields that do not explain the inference", () => {
    const result = parseAiCandidateResponse({
      candidates: [
        {
          expiryDays: { confidence: 0.7, source: "inference", value: 7 },
          name: { confidence: 0.9, source: "image", value: "香蕉" }
        }
      ],
      warnings: []
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.candidates[0].expiryDays).toBeUndefined();
    expect(result.data.warnings).toContain("香蕉 的保质期天数字段缺少推断说明，已忽略。");
  });
});
