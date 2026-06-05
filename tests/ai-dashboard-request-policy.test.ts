import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createChatCompletion: vi.fn(),
  getCurrentUser: vi.fn(),
  prisma: {
    appSetting: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    item: { count: vi.fn(), findMany: vi.fn() },
    location: { findMany: vi.fn() }
  }
}));

vi.mock("@/lib/ai/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/client")>("@/lib/ai/client");
  return {
    ...actual,
    createChatCompletion: mocks.createChatCompletion
  };
});

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

describe("AI dashboard advice request policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    mocks.prisma.appSetting.findMany.mockResolvedValue([]);
    mocks.prisma.item.count.mockResolvedValue(1);
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        category: { name: "食品" },
        expiryDate: null,
        id: 7,
        location: { name: "冰箱" },
        name: "牛奶",
        purchaseDate: null,
        quantity: 2,
        status: "NORMAL",
        updatedAt: new Date("2026-06-03T00:00:00.000Z")
      }
    ]);
    mocks.prisma.category.findMany.mockResolvedValue([{ _count: { items: 1 }, id: 1, name: "食品" }]);
    mocks.prisma.location.findMany.mockResolvedValue([{ _count: { items: 1 }, id: 2, name: "冰箱" }]);
    mocks.createChatCompletion.mockResolvedValue({
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
    });
  });

  it("uses a long timeout and disables retries for dashboard advice calls", async () => {
    await createDashboardAdvice(jsonRequest({}), { env });

    expect(mocks.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, timeoutMs: 120_000 })
    );
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/ai/dashboard-advice", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
}
