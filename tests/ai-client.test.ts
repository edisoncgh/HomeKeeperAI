import { describe, expect, it, vi } from "vitest";
import { createChatCompletion, createAiErrorResponse } from "@/lib/ai/client";

const config = {
  apiKey: "sk-test",
  baseUrl: "https://api.example.test/v1",
  model: "gpt-test"
};

describe("AI client", () => {
  it("calls OpenAI-compatible chat completions with sanitized config", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ choices: [{ message: { content: "{}" } }] }));

    const result = await createChatCompletion({
      config,
      fetcher,
      messages: [{ content: "ping", role: "user" }]
    });

    expect(result).toEqual({ choices: [{ message: { content: "{}" } }] });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer sk-test" }),
        method: "POST"
      })
    );
  });

  it("retries transient remote failures within the configured limit", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "busy" }, 502))
      .mockResolvedValueOnce(jsonResponse({ choices: [] }));

    await expect(
      createChatCompletion({
        config,
        fetcher,
        maxRetries: 1,
        messages: [{ content: "ping", role: "user" }],
        retryDelayMs: 0
      })
    ).resolves.toEqual({ choices: [] });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("maps remote and malformed responses to Chinese user-facing errors", async () => {
    const rateLimited = vi.fn().mockResolvedValue(jsonResponse({ error: "too many" }, 429));
    const malformed = vi.fn().mockResolvedValue({
      json: async () => {
        throw new Error("invalid json");
      },
      ok: true,
      status: 200
    });

    await expect(
      createChatCompletion({ config, fetcher: rateLimited, messages: [{ content: "ping", role: "user" }] })
    ).rejects.toMatchObject({
      publicMessage: "LLM 服务请求过于频繁，请稍后再试。",
      status: 429,
      type: "rate_limit"
    });

    await expect(
      createChatCompletion({ config, fetcher: malformed, messages: [{ content: "ping", role: "user" }] })
    ).rejects.toMatchObject({
      publicMessage: "LLM 服务返回内容异常，请稍后重试。",
      status: 502,
      type: "invalid_response"
    });
  });

  it("builds API error responses without leaking secrets or raw remote errors", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("sk-test upstream exploded"));

    try {
      await createChatCompletion({ config, fetcher, messages: [{ content: "ping", role: "user" }] });
      throw new Error("expected AI client to throw");
    } catch (error) {
      const response = createAiErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.message).toBe("无法连接 LLM 服务，请检查网络或服务配置。");
      expect(JSON.stringify(body)).not.toContain("sk-test");
      expect(JSON.stringify(body)).not.toContain("upstream exploded");
    }
  });
});

function jsonResponse(body: unknown, status = 200) {
  return {
    json: async () => body,
    ok: status >= 200 && status < 300,
    status
  } as Response;
}
