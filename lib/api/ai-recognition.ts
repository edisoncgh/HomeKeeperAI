import { apiError, apiOk } from "@/lib/api/response";
import { AI_VISION_REQUEST_POLICY } from "@/lib/api/ai-vision";
import { createAiErrorResponse, createChatCompletion } from "@/lib/ai/client";
import { AiEnv } from "@/lib/ai/config";
import { AI_SYSTEM_PROMPT, buildPhotoRecognitionPrompt } from "@/lib/ai/prompts";
import { parseAiCandidateResponse } from "@/lib/ai/parse";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getEffectiveAiConfig } from "@/lib/settings/llm";

interface RecognizeItemsFromPhotoOptions {
  env?: AiEnv;
  fetcher?: typeof fetch;
  retryDelayMs?: number;
}

interface RecognitionRequestInput {
  imageDataUrl?: unknown;
  userHint?: unknown;
}

const MAX_IMAGE_DATA_URL_LENGTH = 8_000_000;
const imageDataUrlPattern = /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const taxonomySelect = {
  id: true,
  name: true
};

export async function recognizeItemsFromPhoto(request: Request, options: RecognizeItemsFromPhotoOptions = {}) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const input = await readRecognitionInput(request);
  const imageDataUrl = parseImageDataUrl(input.imageDataUrl);
  if (!imageDataUrl) {
    return apiError("请先选择一张图片。", 400);
  }

  const parsedConfig = await getEffectiveAiConfig(options.env);
  if (!parsedConfig.ok) {
    return apiError(parsedConfig.message, 400, { type: "configuration" });
  }

  const [categories, locations] = await readTaxonomyOptions();
  try {
    const completion = await createChatCompletion({
      ...AI_VISION_REQUEST_POLICY,
      config: parsedConfig.data,
      fetcher: options.fetcher,
      messages: buildRecognitionMessages(imageDataUrl, input, categories, locations),
      retryDelayMs: options.retryDelayMs
    });
    return buildRecognitionResponse(completion, categories, locations);
  } catch (error) {
    return createAiErrorResponse(error);
  }
}

async function readRecognitionInput(request: Request): Promise<RecognitionRequestInput> {
  return request.json().catch(() => ({}));
}

function parseImageDataUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (normalized.length > MAX_IMAGE_DATA_URL_LENGTH || !imageDataUrlPattern.test(normalized)) {
    return null;
  }
  return normalized;
}

async function readTaxonomyOptions() {
  return Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: taxonomySelect }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: taxonomySelect })
  ]);
}

function buildRecognitionMessages(
  imageDataUrl: string,
  input: RecognitionRequestInput,
  categories: { name: string }[],
  locations: { name: string }[]
) {
  return [
    { content: AI_SYSTEM_PROMPT, role: "system" as const },
    {
      content: [
        {
          text: buildPhotoRecognitionPrompt({
            categories: categories.map((category) => category.name),
            locations: locations.map((location) => location.name),
            userHint: readUserHint(input.userHint)
          }),
          type: "text" as const
        },
        { image_url: { url: imageDataUrl }, type: "image_url" as const }
      ],
      role: "user" as const
    }
  ];
}

function readUserHint(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : undefined;
}

function buildRecognitionResponse(
  completion: unknown,
  categories: Array<{ id: number; name: string }>,
  locations: Array<{ id: number; name: string }>
) {
  const content = readCompletionContent(completion);
  const parsed = parseAiCandidateResponse(content);
  if (!parsed.ok) {
    return apiError(parsed.message, 502, { type: "invalid_response" });
  }
  if (parsed.data.candidates.length === 0) {
    return apiError(buildEmptyCandidatesMessage(parsed.data.warnings), 502, {
      type: "empty_candidates",
      warnings: parsed.data.warnings
    });
  }

  return apiOk({
    candidates: parsed.data.candidates,
    categories,
    locations,
    warnings: parsed.data.warnings
  });
}

function buildEmptyCandidatesMessage(warnings: string[]) {
  const detail = warnings.slice(0, 2).join("；");
  return detail
    ? `LLM 没有返回可用候选，请重试或改为手动录入。诊断：${detail}`
    : "LLM 没有返回可用候选，请重试或改为手动录入。";
}

function readCompletionContent(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }
  const choice = Array.isArray(value.choices) ? value.choices[0] : null;
  if (!isRecord(choice) || !isRecord(choice.message)) {
    return "";
  }
  return typeof choice.message.content === "string" ? choice.message.content : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
