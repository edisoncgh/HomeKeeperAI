import { describe, expect, it } from "vitest";
import {
  AI_DASHBOARD_ADVICE_JSON_SCHEMA,
  buildDashboardAdvicePrompt,
  parseAiDashboardAdviceResponse
} from "@/lib/ai/dashboard-advice";

describe("AI dashboard advice contract", () => {
  it("builds a read-only dashboard advice prompt from inventory summaries", () => {
    const prompt = buildDashboardAdvicePrompt({
      categories: [{ id: 1, name: "食品", itemCount: 2 }],
      items: [
        {
          categoryName: "食品",
          expiryDate: "2026-06-10",
          id: 7,
          locationName: "冰箱",
          name: "牛奶",
          quantity: 2,
          status: "NORMAL",
          updatedAt: "2026-06-03"
        }
      ],
      locations: [{ id: 2, name: "冰箱", itemCount: 1 }],
      totalItems: 1
    });

    expect(prompt).toContain("主页 AI 建议");
    expect(prompt).toContain("只读建议");
    expect(prompt).toContain("不要写入数据库");
    expect(prompt).toContain("不要生成 M4 预警");
    expect(prompt).toContain("整理");
    expect(prompt).toContain("补录");
    expect(prompt).toContain("位置优化");
    expect(prompt).toContain("消耗建议");
    expect(prompt).toContain("牛奶");
    expect(prompt).toContain('"type":"consume"');
  });

  it("exports a JSON schema for dashboard advice suggestions", () => {
    const schemaText = JSON.stringify(AI_DASHBOARD_ADVICE_JSON_SCHEMA);

    expect(AI_DASHBOARD_ADVICE_JSON_SCHEMA).toMatchObject({
      additionalProperties: false,
      required: ["suggestions", "warnings"],
      type: "object"
    });
    expect(schemaText).toContain("relatedItemIds");
    expect(schemaText).toContain("confidence");
    expect(schemaText).toContain("organize");
    expect(schemaText).toContain("verify");
  });

  it("parses advice from fenced JSON, filters invalid suggestions, and warns on low confidence", () => {
    const result = parseAiDashboardAdviceResponse(`建议如下：

\`\`\`json
{
  "suggestions": [
    {
      "type": "consume",
      "title": "优先喝掉牛奶",
      "reason": "牛奶将在一周内到期，适合放到首页提醒自己优先消耗。",
      "action": "查看冰箱里的牛奶，确认是否需要本周消耗。",
      "relatedItemIds": [7],
      "confidence": 0.35
    },
    {
      "type": "unknown",
      "title": "错误类型",
      "reason": "类型不在契约中。",
      "action": "忽略。",
      "relatedItemIds": [],
      "confidence": 0.8
    }
  ],
  "warnings": ["部分物品缺少保质期。"]
}
\`\`\``);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.suggestions).toHaveLength(1);
    expect(result.data.suggestions[0]).toMatchObject({
      confidence: 0.35,
      relatedItemIds: [7],
      title: "优先喝掉牛奶",
      type: "consume"
    });
    expect(result.data.warnings).toEqual(
      expect.arrayContaining(["部分物品缺少保质期。", "优先喝掉牛奶 的建议置信度较低，请人工判断。"])
    );
  });

  it("returns a friendly error for non JSON advice responses", () => {
    expect(parseAiDashboardAdviceResponse("今天库存还不错。")).toEqual({
      message: "LLM 返回建议内容无法解析，请稍后重试。",
      ok: false
    });
  });
});
