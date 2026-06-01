import { apiError, apiOk } from "@/lib/api/response";
import { createAiErrorResponse, createChatCompletion } from "@/lib/ai/client";
import { AiConfig, AiEnv } from "@/lib/ai/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getEffectiveAiConfig } from "@/lib/settings/llm";

interface CheckAiHealthOptions {
  env?: AiEnv;
  fetcher?: typeof fetch;
  retryDelayMs?: number;
}

export async function checkAiHealth(options: CheckAiHealthOptions = {}) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const parsed = await getEffectiveAiConfig(options.env);
  if (!parsed.ok) {
    return apiError(parsed.message, 400, { type: "configuration" });
  }

  try {
    await createHealthCheckCompletion(parsed.data, options);
    return apiOk({ baseUrl: parsed.data.baseUrl, model: parsed.data.model, status: "ok" });
  } catch (error) {
    return createAiErrorResponse(error);
  }
}

function createHealthCheckCompletion(config: AiConfig, options: CheckAiHealthOptions) {
  return createChatCompletion({
    config,
    fetcher: options.fetcher,
    messages: [
      { content: "你是家庭仓储助手的 LLM 连通性检查服务。", role: "system" },
      { content: "请返回一个简短 JSON 对象表示服务可用。", role: "user" }
    ],
    retryDelayMs: options.retryDelayMs
  });
}
