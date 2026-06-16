import { describe, expect, it } from "vitest";
import {
  AI_ITEM_CANDIDATE_JSON_SCHEMA,
  AI_SYSTEM_PROMPT,
  buildOrderParsingPrompt,
  buildPhotoRecognitionPrompt
} from "@/lib/ai/prompts";

describe("AI structured contract", () => {
  it("states the candidate-only and source attribution rules in the system prompt", () => {
    expect(AI_SYSTEM_PROMPT).toContain("只生成候选");
    expect(AI_SYSTEM_PROMPT).toContain("不要直接写入");
    expect(AI_SYSTEM_PROMPT).toContain("source");
    expect(AI_SYSTEM_PROMPT).toContain("confidence");
    expect(AI_SYSTEM_PROMPT).toContain("inference");
    expect(AI_SYSTEM_PROMPT).toContain("只输出 JSON");
  });

  it("builds photo recognition prompts with existing categories and locations", () => {
    const prompt = buildPhotoRecognitionPrompt({
      categories: ["食品", "日用品"],
      locations: ["冰箱", "储物间"],
      userHint: "优先识别水果"
    });

    expect(prompt).toContain("拍照识别");
    expect(prompt).toContain("食品、日用品");
    expect(prompt).toContain("冰箱、储物间");
    expect(prompt).toContain("优先识别水果");
    expect(prompt).toContain("图片中没有出现的保质期");
    expect(prompt).toContain("数量单位");
    expect(prompt).toContain("规格");
    expect(prompt).toContain('"candidates"');
    expect(prompt).toContain('"name"');
    expect(prompt).toContain('"value":"香蕉"');
    expect(prompt).toContain('"unit"');
    expect(prompt).toContain('"specification"');
    expect(prompt).toContain('"source":"image"');
    expect(prompt).toContain('"confidence":0.9');
  });

  it("builds order parsing prompts with taxonomy context and order evidence priorities", () => {
    const prompt = buildOrderParsingPrompt({
      categories: ["食品", "日用品"],
      locations: ["冰箱", "储物间"],
      orderSource: "京东截图"
    });

    expect(prompt).toContain("订单截图");
    expect(prompt).toContain("京东截图");
    expect(prompt).toContain("食品、日用品");
    expect(prompt).toContain("冰箱、储物间");
    expect(prompt).toContain("价格");
    expect(prompt).toContain("采购日期");
    expect(prompt).toContain("数量单位");
    expect(prompt).toContain("规格");
    expect(prompt).toContain("source: \"order\"");
    expect(prompt).toContain('"purchasePrice"');
    expect(prompt).toContain('"purchaseDate"');
    expect(prompt).toContain('"unit"');
    expect(prompt).toContain('"specification"');
    expect(prompt).toContain('"source":"order"');
  });

  it("exports a JSON schema for candidates, warnings, field sources and confidence", () => {
    const schemaText = JSON.stringify(AI_ITEM_CANDIDATE_JSON_SCHEMA);

    expect(AI_ITEM_CANDIDATE_JSON_SCHEMA).toMatchObject({
      additionalProperties: false,
      required: ["candidates", "warnings"],
      type: "object"
    });
    expect(schemaText).toContain("candidates");
    expect(schemaText).toContain("warnings");
    expect(schemaText).toContain("confidence");
    expect(schemaText).toContain("unit");
    expect(schemaText).toContain("specification");
    expect(schemaText).toContain('"image"');
    expect(schemaText).toContain('"order"');
    expect(schemaText).toContain('"inference"');
    expect(schemaText).toContain('"user"');
  });
});
