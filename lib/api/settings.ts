import { apiError, apiOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { AiEnv } from "@/lib/ai/config";
import { getLlmSettingsView, saveLlmSettings } from "@/lib/settings/llm";
import { parseLlmSettingsInput } from "@/lib/validation/settings";

export async function getLlmSettings(env: AiEnv = process.env) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const settings = await getLlmSettingsView(env);
  return apiOk({ settings });
}

export async function updateLlmSettings(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const parsed = parseLlmSettingsInput(await readRequestJson(request));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  const currentSettings = parsed.data.apiKeyAction === "keep" ? await getLlmSettingsView() : null;
  await saveLlmSettings(parsed.data);
  return apiOk({
    settings: {
      apiKeyConfigured: getNextApiKeyConfigured(parsed.data.apiKeyAction, currentSettings?.apiKeyConfigured ?? false),
      baseUrl: parsed.data.baseUrl,
      model: parsed.data.model
    }
  });
}

async function readRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getNextApiKeyConfigured(apiKeyAction: "clear" | "keep" | "replace", currentValue: boolean) {
  if (apiKeyAction === "clear") {
    return false;
  }

  return apiKeyAction === "replace" ? true : currentValue;
}
