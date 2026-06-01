import type { ApiKeyAction } from "@/lib/settings/llm";

type ParseLlmSettingsResult =
  | { data: { apiKey?: string; apiKeyAction: ApiKeyAction; baseUrl: string; model: string }; ok: true }
  | { message: string; ok: false };

export function parseLlmSettingsInput(input: unknown): ParseLlmSettingsResult {
  if (!isRecord(input)) {
    return { message: "设置内容格式不正确。", ok: false };
  }

  const baseUrl = normalizeUrl(input.baseUrl);
  if (!baseUrl) {
    return { message: "LLM Base URL 格式不正确。", ok: false };
  }

  const model = toTrimmedString(input.model);
  if (!model) {
    return { message: "请填写 LLM 模型。", ok: false };
  }

  const apiKeyAction = parseApiKeyAction(input.apiKeyAction);
  if (!apiKeyAction) {
    return { message: "API Key 操作不正确。", ok: false };
  }

  const apiKey = toTrimmedString(input.apiKey);
  if (apiKeyAction === "replace" && !apiKey) {
    return { message: "请填写新的 LLM API Key。", ok: false };
  }

  return { data: { apiKey: apiKey ?? undefined, apiKeyAction, baseUrl, model }, ok: true };
}

function normalizeUrl(value: unknown) {
  const text = toTrimmedString(value);
  if (!text) {
    return null;
  }

  try {
    return new URL(text).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function parseApiKeyAction(value: unknown): ApiKeyAction | null {
  return value === "clear" || value === "keep" || value === "replace" ? value : null;
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
