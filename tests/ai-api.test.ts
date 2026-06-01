import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

import { checkAiHealth } from "@/lib/api/ai";

describe("AI API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated health checks", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await checkAiHealth();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("returns configuration errors without leaking secrets", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

    const response = await checkAiHealth({
      env: { LLM_API_KEY: "sk-secret", LLM_BASE_URL: "https://api.example.test/v1" }
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      code: 400,
      data: { type: "configuration" },
      message: "请先配置 LLM 模型。"
    });
    expect(JSON.stringify(body)).not.toContain("sk-secret");
  });

  it("returns sanitized remote errors for failed health checks", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const fetcher = vi.fn().mockRejectedValue(new Error("sk-secret unreachable"));

    const response = await checkAiHealth({
      env: { LLM_API_KEY: "sk-secret", LLM_BASE_URL: "https://api.example.test/v1", LLM_MODEL: "gpt-test" },
      fetcher,
      retryDelayMs: 0
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toBe("无法连接 LLM 服务，请检查网络或服务配置。");
    expect(JSON.stringify(body)).not.toContain("sk-secret");
    expect(JSON.stringify(body)).not.toContain("unreachable");
  });
});
