import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    appSetting: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    location: { findMany: vi.fn() }
  }
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthSecret: () => "auth-secret"
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

import { recognizeItemsFromPhoto } from "@/lib/api/ai-recognition";

const env = {
  LLM_API_KEY: "sk-secret",
  LLM_BASE_URL: "https://api.example.test/v1",
  LLM_MODEL: "gpt-test"
};

describe("recognizeItemsFromPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.appSetting.findMany.mockResolvedValue([]);
    mocks.prisma.category.findMany.mockResolvedValue([{ id: 1, name: "食品" }]);
    mocks.prisma.location.findMany.mockResolvedValue([{ id: 2, name: "冰箱" }]);
  });

  it("rejects unauthenticated recognition requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await recognizeItemsFromPhoto(jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD" }), { env });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("rejects missing or unsupported image input", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

    const response = await recognizeItemsFromPhoto(jsonRequest({ imageDataUrl: "https://example.test/a.png" }), { env });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("请先选择一张图片。");
  });

  it("calls the LLM with existing taxonomy names and a vision image message", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [{ name: { confidence: 0.91, source: "image", value: "香蕉" } }],
                warnings: []
              })
            }
          }
        ]
      })
    );

    const response = await recognizeItemsFromPhoto(
      jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD", userHint: "这是冰箱里的水果" }),
      { env, fetcher, retryDelayMs: 0 }
    );
    const body = await response.json();
    const [, init] = fetcher.mock.calls[0];
    const requestBody = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      candidates: [{ name: { source: "image", value: "香蕉" } }],
      categories: [{ id: 1, name: "食品" }],
      locations: [{ id: 2, name: "冰箱" }],
      warnings: []
    });
    expect(JSON.stringify(requestBody.messages)).toContain("现有分类：食品");
    expect(JSON.stringify(requestBody.messages)).toContain("现有位置：冰箱");
    expect(JSON.stringify(requestBody.messages)).toContain("这是冰箱里的水果");
    expect(requestBody.messages[1].content).toEqual(
      expect.arrayContaining([{ image_url: { url: "data:image/png;base64,QUJD" }, type: "image_url" }])
    );
  });

  it("returns a friendly error when the LLM response cannot produce candidates", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ choices: [{ message: { content: "无法识别。" } }] }));

    const response = await recognizeItemsFromPhoto(jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD" }), {
      env,
      fetcher,
      retryDelayMs: 0
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toBe("LLM 返回内容无法解析，请重试或改为手动录入。");
    expect(JSON.stringify(body)).not.toContain("sk-secret");
  });

  it("returns parser warnings when all LLM candidates are filtered out", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [],
                warnings: ["模型使用了非标准字段来源。"]
              })
            }
          }
        ]
      })
    );

    const response = await recognizeItemsFromPhoto(jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD" }), {
      env,
      fetcher,
      retryDelayMs: 0
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toContain("LLM 没有返回可用候选");
    expect(body.message).toContain("模型使用了非标准字段来源。");
    expect(body.data.warnings).toContain("模型使用了非标准字段来源。");
    expect(JSON.stringify(body)).not.toContain("sk-secret");
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/items/recognize", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
}

function jsonResponse(body: unknown, status = 200) {
  return {
    json: async () => body,
    ok: status >= 200 && status < 300,
    status
  } as Response;
}
