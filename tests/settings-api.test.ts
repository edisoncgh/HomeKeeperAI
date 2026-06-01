import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    appSetting: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn()
    },
    $transaction: vi.fn()
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

import { getLlmSettings, updateLlmSettings } from "@/lib/api/settings";
import { encryptSecret } from "@/lib/settings/secret";

describe("LLM settings API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (operations) => Promise.all(operations));
  });

  it("requires authentication", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await getLlmSettings({ LLM_MODEL: "gpt-test" });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("reads database settings without exposing the API key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    mocks.prisma.appSetting.findMany.mockResolvedValue([
      { key: "llm.baseUrl", value: "https://db.example.test/v1" },
      { key: "llm.model", value: "gpt-db" },
      { key: "llm.apiKey", value: encryptSecret("sk-db-secret", "auth-secret") }
    ]);

    const response = await getLlmSettings({ LLM_BASE_URL: "https://env.example.test/v1", LLM_MODEL: "gpt-env" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.settings).toEqual({
      apiKeyConfigured: true,
      baseUrl: "https://db.example.test/v1",
      model: "gpt-db"
    });
    expect(JSON.stringify(body)).not.toContain("sk-db-secret");
  });

  it("saves settings and encrypts replaced API keys", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

    const response = await updateLlmSettings(
      buildSettingsRequest({
        apiKey: "sk-new-secret",
        apiKeyAction: "replace",
        baseUrl: "https://api.example.test/v1",
        model: "gpt-test"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.settings).toMatchObject({
      apiKeyConfigured: true,
      baseUrl: "https://api.example.test/v1",
      model: "gpt-test"
    });
    const apiKeyWrite = mocks.prisma.appSetting.upsert.mock.calls.find(([input]) => input.where.key === "llm.apiKey");
    expect(apiKeyWrite?.[0].create.value).not.toContain("sk-new-secret");
  });

  it("clears stored API keys when requested", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

    const response = await updateLlmSettings(
      buildSettingsRequest({
        apiKeyAction: "clear",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3.2-vision"
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.prisma.appSetting.deleteMany).toHaveBeenCalledWith({ where: { key: "llm.apiKey" } });
  });
});

function buildSettingsRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/settings/llm", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PUT"
  });
}
