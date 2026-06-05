import { apiError, apiOk } from "@/lib/api/response";
import { AI_INTERACTIVE_REQUEST_POLICY } from "@/lib/api/ai-interactive";
import { createAiErrorResponse, createChatCompletion } from "@/lib/ai/client";
import { AiEnv } from "@/lib/ai/config";
import {
  AI_DASHBOARD_ADVICE_SYSTEM_PROMPT,
  buildDashboardAdvicePrompt,
  DashboardAdvicePromptInput,
  parseAiDashboardAdviceResponse
} from "@/lib/ai/dashboard-advice";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getEffectiveAiConfig } from "@/lib/settings/llm";

interface CreateDashboardAdviceOptions {
  env?: AiEnv;
  fetcher?: typeof fetch;
  retryDelayMs?: number;
}

const DASHBOARD_ITEM_LIMIT = 40;

export async function createDashboardAdvice(_request: Request, options: CreateDashboardAdviceOptions = {}) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const parsedConfig = await getEffectiveAiConfig(options.env);
  if (!parsedConfig.ok) {
    return apiError(parsedConfig.message, 400, { type: "configuration" });
  }

  const summary = await readDashboardSummary();
  try {
    const completion = await createChatCompletion({
      ...AI_INTERACTIVE_REQUEST_POLICY,
      config: parsedConfig.data,
      fetcher: options.fetcher,
      messages: buildDashboardAdviceMessages(summary),
      retryDelayMs: options.retryDelayMs
    });
    return buildDashboardAdviceResponse(completion, summary);
  } catch (error) {
    return createAiErrorResponse(error);
  }
}

async function readDashboardSummary(): Promise<DashboardAdvicePromptInput> {
  const [totalItems, items, categories, locations] = await Promise.all([
    prisma.item.count(),
    readRecentItems(),
    readCategorySummaries(),
    readLocationSummaries()
  ]);
  return { categories, items, locations, totalItems };
}

function readRecentItems() {
  return prisma.item.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      category: { select: { name: true } },
      expiryDate: true,
      id: true,
      location: { select: { name: true } },
      name: true,
      purchaseDate: true,
      quantity: true,
      status: true,
      updatedAt: true
    },
    take: DASHBOARD_ITEM_LIMIT
  }).then((items) =>
    items.map((item) => ({
      categoryName: item.category?.name ?? null,
      expiryDate: formatDate(item.expiryDate),
      id: item.id,
      locationName: item.location?.name ?? null,
      name: item.name,
      purchaseDate: formatDate(item.purchaseDate),
      quantity: item.quantity,
      status: item.status,
      updatedAt: formatDate(item.updatedAt) ?? ""
    }))
  );
}

function readCategorySummaries() {
  return prisma.category
    .findMany({ orderBy: { name: "asc" }, select: { _count: { select: { items: true } }, id: true, name: true } })
    .then((values) => values.map((value) => ({ id: value.id, itemCount: value._count.items, name: value.name })));
}

function readLocationSummaries() {
  return prisma.location
    .findMany({ orderBy: { name: "asc" }, select: { _count: { select: { items: true } }, id: true, name: true } })
    .then((values) => values.map((value) => ({ id: value.id, itemCount: value._count.items, name: value.name })));
}

function buildDashboardAdviceMessages(summary: DashboardAdvicePromptInput) {
  return [
    { content: AI_DASHBOARD_ADVICE_SYSTEM_PROMPT, role: "system" as const },
    { content: buildDashboardAdvicePrompt(summary), role: "user" as const }
  ];
}

function buildDashboardAdviceResponse(completion: unknown, summary: DashboardAdvicePromptInput) {
  const parsed = parseAiDashboardAdviceResponse(readCompletionContent(completion));
  if (!parsed.ok) {
    return apiError(parsed.message, 502, { type: "invalid_response" });
  }
  if (parsed.data.suggestions.length === 0) {
    return apiError(buildEmptySuggestionsMessage(parsed.data.warnings), 502, {
      type: "empty_suggestions",
      warnings: parsed.data.warnings
    });
  }
  return apiOk({
    suggestions: parsed.data.suggestions,
    summary: buildResponseSummary(summary),
    warnings: parsed.data.warnings
  });
}

function buildResponseSummary(summary: DashboardAdvicePromptInput) {
  return {
    categoryCount: summary.categories.length,
    includedItems: summary.items.length,
    itemLimit: DASHBOARD_ITEM_LIMIT,
    locationCount: summary.locations.length,
    totalItems: summary.totalItems
  };
}

function buildEmptySuggestionsMessage(warnings: string[]) {
  const detail = warnings.slice(0, 2).join("；");
  return detail ? `LLM 没有返回可用建议，请稍后重试。诊断：${detail}` : "LLM 没有返回可用建议，请稍后重试。";
}

function readCompletionContent(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }
  const choice = Array.isArray(value.choices) ? value.choices[0] : null;
  return isRecord(choice) && isRecord(choice.message) && typeof choice.message.content === "string"
    ? choice.message.content
    : "";
}

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
