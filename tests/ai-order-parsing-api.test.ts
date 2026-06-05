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

import { parseItemsFromOrderImage } from "@/lib/api/ai-order-parsing";

const env = {
  LLM_API_KEY: "sk-secret",
  LLM_BASE_URL: "https://api.example.test/v1",
  LLM_MODEL: "gpt-test"
};

describe("parseItemsFromOrderImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.appSetting.findMany.mockResolvedValue([]);
    mocks.prisma.category.findMany.mockResolvedValue([{ id: 1, name: "食品" }]);
    mocks.prisma.location.findMany.mockResolvedValue([{ id: 2, name: "储物间" }]);
  });

  it("rejects unauthenticated order parsing requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await parseItemsFromOrderImage(jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD" }), { env });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("rejects missing or unsupported order screenshot input", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

    const response = await parseItemsFromOrderImage(jsonRequest({ imageDataUrl: "https://example.test/order.png" }), { env });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("请先选择一张订单截图。");
  });

  it("calls the LLM with taxonomy names, order source, and a vision image message", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  {
                    categoryName: { confidence: 0.76, reason: "牛奶按食品管理。", source: "inference", value: "食品" },
                    name: { confidence: 0.92, source: "order", value: "牛奶" },
                    purchaseDate: { confidence: 0.82, source: "order", value: "2026-06-02" },
                    purchasePrice: { confidence: 0.84, source: "order", value: 18.9 },
                    quantity: { confidence: 0.88, source: "order", value: 2 }
                  }
                ],
                warnings: []
              })
            }
          }
        ]
      })
    );

    const response = await parseItemsFromOrderImage(
      jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD", orderSource: "京东截图" }),
      { env, fetcher, retryDelayMs: 0 }
    );
    const body = await response.json();
    const [, init] = fetcher.mock.calls[0];
    const requestBody = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      candidates: [
        {
          name: { source: "order", value: "牛奶" },
          purchaseDate: { source: "order", value: "2026-06-02" },
          purchasePrice: { source: "order", value: 18.9 },
          quantity: { source: "order", value: 2 }
        }
      ],
      categories: [{ id: 1, name: "食品" }],
      locations: [{ id: 2, name: "储物间" }],
      warnings: []
    });
    expect(JSON.stringify(requestBody.messages)).toContain("现有分类：食品");
    expect(JSON.stringify(requestBody.messages)).toContain("现有位置：储物间");
    expect(JSON.stringify(requestBody.messages)).toContain("订单来源：京东截图");
    expect(requestBody.messages[1].content).toEqual(
      expect.arrayContaining([{ image_url: { url: "data:image/png;base64,QUJD" }, type: "image_url" }])
    );
  });

  it("returns parser warnings when all order candidates are filtered out", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({ candidates: [], warnings: ["订单截图中的商品名不清晰。"] })
            }
          }
        ]
      })
    );

    const response = await parseItemsFromOrderImage(jsonRequest({ imageDataUrl: "data:image/png;base64,QUJD" }), {
      env,
      fetcher,
      retryDelayMs: 0
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toContain("LLM 没有返回可用订单候选");
    expect(body.message).toContain("订单截图中的商品名不清晰。");
    expect(body.data.warnings).toContain("订单截图中的商品名不清晰。");
    expect(JSON.stringify(body)).not.toContain("sk-secret");
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/items/parse-order", {
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
