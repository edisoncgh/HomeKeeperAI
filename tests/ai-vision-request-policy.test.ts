import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createChatCompletion: vi.fn(),
  getCurrentUser: vi.fn(),
  prisma: {
    appSetting: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
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

import { parseItemsFromOrderImage } from "@/lib/api/ai-order-parsing";
import { recognizeItemsFromPhoto } from "@/lib/api/ai-recognition";

const env = {
  LLM_API_KEY: "sk-secret",
  LLM_BASE_URL: "https://api.example.test/v1",
  LLM_MODEL: "gpt-test"
};

describe("AI vision request policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    mocks.prisma.appSetting.findMany.mockResolvedValue([]);
    mocks.prisma.category.findMany.mockResolvedValue([{ id: 1, name: "食品" }]);
    mocks.prisma.location.findMany.mockResolvedValue([{ id: 2, name: "冰箱" }]);
    mocks.createChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              candidates: [{ name: { confidence: 0.9, source: "image", value: "香蕉" } }],
              warnings: []
            })
          }
        }
      ]
    });
  });

  it("uses a long timeout and disables retries for photo recognition vision calls", async () => {
    await recognizeItemsFromPhoto(jsonRequest("/api/items/recognize", { imageDataUrl: "data:image/png;base64,QUJD" }), { env });

    expect(mocks.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, timeoutMs: 120_000 })
    );
  });

  it("uses a long timeout and disables retries for order parsing vision calls", async () => {
    await parseItemsFromOrderImage(jsonRequest("/api/items/parse-order", { imageDataUrl: "data:image/png;base64,QUJD" }), { env });

    expect(mocks.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, timeoutMs: 120_000 })
    );
  });
});

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
}
