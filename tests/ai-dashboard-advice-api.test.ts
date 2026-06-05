import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    appSetting: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    item: { count: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    itemRecord: { create: vi.fn() },
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

import { createDashboardAdvice } from "@/lib/api/ai-dashboard-advice";

const env = {
  LLM_API_KEY: "sk-secret",
  LLM_BASE_URL: "https://api.example.test/v1",
  LLM_MODEL: "gpt-test"
};

describe("createDashboardAdvice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.appSetting.findMany.mockResolvedValue([]);
    mocks.prisma.item.count.mockResolvedValue(1);
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        category: { id: 1, name: "食品" },
        expiryDate: new Date("2026-06-10T00:00:00.000Z"),
        id: 7,
        location: { id: 2, name: "冰箱" },
        name: "牛奶",
        purchaseDate: null,
        quantity: 2,
        status: "NORMAL",
        updatedAt: new Date("2026-06-03T00:00:00.000Z")
      }
    ]);
    mocks.prisma.category.findMany.mockResolvedValue([{ _count: { items: 1 }, id: 1, name: "食品" }]);
    mocks.prisma.location.findMany.mockResolvedValue([{ _count: { items: 1 }, id: 2, name: "冰箱" }]);
  });

  it("rejects unauthenticated dashboard advice requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await createDashboardAdvice(jsonRequest({}), { env });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("reads inventory summaries on the server and returns read-only suggestions", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  {
                    action: "本周优先查看冰箱里的牛奶。",
                    confidence: 0.82,
                    reason: "牛奶有明确保质期，适合作为近期消耗建议。",
                    relatedItemIds: [7],
                    title: "优先处理牛奶",
                    type: "consume"
                  }
                ],
                warnings: []
              })
            }
          }
        ]
      })
    );

    const response = await createDashboardAdvice(jsonRequest({ items: [{ id: 999, name: "伪造物品" }] }), {
      env,
      fetcher,
      retryDelayMs: 0
    });
    const body = await response.json();
    const [, init] = fetcher.mock.calls[0];
    const requestBody = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      summary: { itemLimit: 40, totalItems: 1 },
      suggestions: [{ relatedItemIds: [7], title: "优先处理牛奶", type: "consume" }],
      warnings: []
    });
    expect(JSON.stringify(requestBody.messages)).toContain("牛奶");
    expect(JSON.stringify(requestBody.messages)).not.toContain("伪造物品");
    expect(mocks.prisma.item.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 40 }));
    expect(mocks.prisma.item.create).not.toHaveBeenCalled();
    expect(mocks.prisma.item.update).not.toHaveBeenCalled();
    expect(mocks.prisma.itemRecord.create).not.toHaveBeenCalled();
  });

  it("returns parser warnings when no usable suggestions are returned", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: JSON.stringify({ suggestions: [], warnings: ["库存数据太少。"] }) } }]
      })
    );

    const response = await createDashboardAdvice(jsonRequest({}), { env, fetcher, retryDelayMs: 0 });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toContain("LLM 没有返回可用建议");
    expect(body.data.warnings).toContain("库存数据太少。");
    expect(JSON.stringify(body)).not.toContain("sk-secret");
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/ai/dashboard-advice", {
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
