const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export interface AiConfig {
  apiKey: string | null;
  baseUrl: string;
  model: string;
}

export type AiEnv = Record<string, string | undefined>;

type ParseAiConfigResult = { data: AiConfig; ok: true } | { message: string; ok: false };

export function parseAiConfig(env: AiEnv = process.env): ParseAiConfigResult {
  const model = trimToNull(env.LLM_MODEL);
  if (!model) {
    return { message: "请先配置 LLM 模型。", ok: false };
  }

  const baseUrl = normalizeBaseUrl(env.LLM_BASE_URL);
  if (!baseUrl) {
    return { message: "LLM Base URL 格式不正确。", ok: false };
  }

  const apiKey = trimToNull(env.LLM_API_KEY);
  if (!apiKey && !isLocalBaseUrl(baseUrl)) {
    return { message: "请先配置 LLM API Key。", ok: false };
  }

  return { data: { apiKey, baseUrl, model }, ok: true };
}

function trimToNull(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeBaseUrl(value: string | undefined) {
  const rawUrl = trimToNull(value) ?? DEFAULT_BASE_URL;
  try {
    return new URL(rawUrl).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isLocalBaseUrl(baseUrl: string) {
  const hostname = new URL(baseUrl).hostname.toLowerCase();
  return hostname === "localhost" || hostname === "0.0.0.0" || hostname === "::1" || hostname.startsWith("127.");
}
