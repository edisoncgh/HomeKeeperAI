import { apiError } from "@/lib/api/response";
import type { AiConfig } from "@/lib/ai/config";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 250;

export type AiErrorType = "auth" | "invalid_response" | "network" | "rate_limit" | "remote" | "timeout";

export interface AiMessage {
  content: string;
  role: "assistant" | "system" | "user";
}

interface CreateChatCompletionOptions {
  config: AiConfig;
  fetcher?: typeof fetch;
  maxRetries?: number;
  messages: AiMessage[];
  retryDelayMs?: number;
  timeoutMs?: number;
}

export class AiServiceError extends Error {
  constructor(
    readonly type: AiErrorType,
    readonly publicMessage: string,
    readonly status: number
  ) {
    super(publicMessage);
  }
}

export async function createChatCompletion(options: CreateChatCompletionOptions) {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestChatCompletion(options);
    } catch (error) {
      if (!shouldRetry(error, attempt, maxRetries)) {
        throw error;
      }
      await delay(options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
    }
  }
}

export function createAiErrorResponse(error: unknown) {
  if (error instanceof AiServiceError) {
    return apiError(error.publicMessage, error.status, { type: error.type });
  }

  return apiError("LLM 服务异常，请稍后重试。", 500, { type: "unknown" });
}

async function requestChatCompletion(options: CreateChatCompletionOptions) {
  const response = await callRemoteService(options);
  if (!response.ok) {
    throw buildRemoteError(response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new AiServiceError("invalid_response", "LLM 服务返回内容异常，请稍后重试。", 502);
  }
}

async function callRemoteService(options: CreateChatCompletionOptions) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    return await (options.fetcher ?? fetch)(`${options.config.baseUrl}/chat/completions`, {
      body: JSON.stringify({ messages: options.messages, model: options.config.model }),
      headers: buildHeaders(options.config),
      method: "POST",
      signal: controller.signal
    });
  } catch (error) {
    throw normalizeFetchError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildHeaders(config: AiConfig) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.apiKey) {
    headers.authorization = `Bearer ${config.apiKey}`;
  }
  return headers;
}

function buildRemoteError(status: number) {
  if (status === 401 || status === 403) {
    return new AiServiceError("auth", "LLM 服务认证失败，请检查 API Key。", 502);
  }
  if (status === 429) {
    return new AiServiceError("rate_limit", "LLM 服务请求过于频繁，请稍后再试。", 429);
  }
  return new AiServiceError("remote", getRemoteErrorMessage(status), 502);
}

function getRemoteErrorMessage(status: number) {
  return status >= 500 ? "LLM 服务暂时不可用，请稍后重试。" : "LLM 服务请求失败，请检查模型或服务配置。";
}

function normalizeFetchError(error: unknown) {
  if (isAbortError(error)) {
    return new AiServiceError("timeout", "LLM 服务响应超时，请稍后重试。", 504);
  }
  return new AiServiceError("network", "无法连接 LLM 服务，请检查网络或服务配置。", 502);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function shouldRetry(error: unknown, attempt: number, maxRetries: number) {
  return error instanceof AiServiceError && isRetryable(error.type) && attempt < maxRetries;
}

function isRetryable(type: AiErrorType) {
  return type === "network" || type === "rate_limit" || type === "remote" || type === "timeout";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
