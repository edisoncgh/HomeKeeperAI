import { AiEnv, parseAiConfig } from "@/lib/ai/config";
import { getAuthSecret } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/settings/secret";

export const LLM_SETTING_KEYS = {
  apiKey: "llm.apiKey",
  baseUrl: "llm.baseUrl",
  model: "llm.model"
} as const;

export type ApiKeyAction = "clear" | "keep" | "replace";

export interface LlmSettingsView {
  apiKeyConfigured: boolean;
  baseUrl: string;
  model: string;
}

export async function getLlmSettingsView(env: AiEnv = process.env): Promise<LlmSettingsView> {
  const settings = await readLlmSettings();
  return {
    apiKeyConfigured: Boolean(settings.apiKey ?? env.LLM_API_KEY?.trim()),
    baseUrl: settings.baseUrl ?? env.LLM_BASE_URL?.trim() ?? "https://api.openai.com/v1",
    model: settings.model ?? env.LLM_MODEL?.trim() ?? ""
  };
}

export async function getEffectiveAiConfig(env: AiEnv = process.env) {
  const settings = await readLlmSettings();
  return parseAiConfig({
    LLM_API_KEY: settings.apiKey ?? env.LLM_API_KEY,
    LLM_BASE_URL: settings.baseUrl ?? env.LLM_BASE_URL,
    LLM_MODEL: settings.model ?? env.LLM_MODEL
  });
}

export async function saveLlmSettings(input: { apiKey?: string; apiKeyAction: ApiKeyAction; baseUrl: string; model: string }) {
  const writes = [
    upsertSetting(LLM_SETTING_KEYS.baseUrl, input.baseUrl),
    upsertSetting(LLM_SETTING_KEYS.model, input.model)
  ];

  if (input.apiKeyAction === "replace" && input.apiKey) {
    writes.push(upsertSetting(LLM_SETTING_KEYS.apiKey, encryptSecret(input.apiKey, getAuthSecret())));
  }

  await prisma.$transaction(writes);
  if (input.apiKeyAction === "clear") {
    await prisma.appSetting.deleteMany({ where: { key: LLM_SETTING_KEYS.apiKey } });
  }
}

async function readLlmSettings() {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: Object.values(LLM_SETTING_KEYS) } }
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));

  return {
    apiKey: decryptSecret(values.get(LLM_SETTING_KEYS.apiKey), getAuthSecret()),
    baseUrl: values.get(LLM_SETTING_KEYS.baseUrl) ?? null,
    model: values.get(LLM_SETTING_KEYS.model) ?? null
  };
}

function upsertSetting(key: string, value: string) {
  return prisma.appSetting.upsert({
    create: { key, value },
    update: { value },
    where: { key }
  });
}
