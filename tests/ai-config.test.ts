import { describe, expect, it } from "vitest";
import { parseAiConfig } from "@/lib/ai/config";

describe("AI config", () => {
  it("normalizes OpenAI-compatible config", () => {
    expect(
      parseAiConfig({
        LLM_API_KEY: "  sk-test  ",
        LLM_BASE_URL: " https://api.example.test/v1/ ",
        LLM_MODEL: "  gpt-test  "
      })
    ).toEqual({
      data: {
        apiKey: "sk-test",
        baseUrl: "https://api.example.test/v1",
        model: "gpt-test"
      },
      ok: true
    });
  });

  it("requires model and non-local API key", () => {
    expect(parseAiConfig({ LLM_API_KEY: "sk-test" })).toMatchObject({
      message: "请先配置 LLM 模型。",
      ok: false
    });

    expect(parseAiConfig({ LLM_BASE_URL: "https://api.example.test/v1", LLM_MODEL: "gpt-test" })).toMatchObject({
      message: "请先配置 LLM API Key。",
      ok: false
    });
  });

  it("allows local OpenAI-compatible services without an API key", () => {
    expect(parseAiConfig({ LLM_BASE_URL: "http://localhost:11434/v1", LLM_MODEL: "llama3.2-vision" })).toEqual({
      data: {
        apiKey: null,
        baseUrl: "http://localhost:11434/v1",
        model: "llama3.2-vision"
      },
      ok: true
    });
  });
});
