export const AI_DASHBOARD_ADVICE_TYPES = ["organize", "complete", "relocate", "consume", "verify"] as const;

export type AiDashboardAdviceType = (typeof AI_DASHBOARD_ADVICE_TYPES)[number];

export interface DashboardAdviceSummaryItem {
  categoryName?: string | null;
  expiryDate?: string | null;
  id: number;
  locationName?: string | null;
  name: string;
  purchaseDate?: string | null;
  quantity: number;
  status: string;
  updatedAt: string;
}

export interface DashboardAdviceTaxonomySummary {
  id: number;
  itemCount: number;
  name: string;
}

export interface DashboardAdvicePromptInput {
  categories: DashboardAdviceTaxonomySummary[];
  items: DashboardAdviceSummaryItem[];
  locations: DashboardAdviceTaxonomySummary[];
  totalItems: number;
}

export interface AiDashboardSuggestion {
  action: string;
  confidence: number;
  reason: string;
  relatedItemIds: number[];
  title: string;
  type: AiDashboardAdviceType;
}

export interface AiDashboardAdviceResponse {
  suggestions: AiDashboardSuggestion[];
  warnings: string[];
}

type ParseDashboardAdviceResult = { data: AiDashboardAdviceResponse; ok: true } | { message: string; ok: false };

const typeSchema = { enum: AI_DASHBOARD_ADVICE_TYPES, type: "string" } as const;

export const AI_DASHBOARD_ADVICE_JSON_SCHEMA = {
  additionalProperties: false,
  properties: {
    suggestions: {
      items: {
        additionalProperties: false,
        properties: {
          action: { minLength: 1, type: "string" },
          confidence: { maximum: 1, minimum: 0, type: "number" },
          reason: { minLength: 1, type: "string" },
          relatedItemIds: { items: { minimum: 1, type: "integer" }, type: "array" },
          title: { minLength: 1, type: "string" },
          type: typeSchema
        },
        required: ["type", "title", "reason", "action", "relatedItemIds", "confidence"],
        type: "object"
      },
      type: "array"
    },
    warnings: { items: { type: "string" }, type: "array" }
  },
  required: ["suggestions", "warnings"],
  type: "object"
} as const;

export const AI_DASHBOARD_ADVICE_SYSTEM_PROMPT = [
  "你是家庭仓储管理系统的首页建议助手。",
  "你的任务是生成只读建议，帮助用户整理、补录、优化位置、安排消耗或核对信息。",
  "不要写入数据库，不要修改、删除或创建正式物品。",
  "不要生成 M4 预警，不要把临期、过期、低库存建议伪装成系统预警。",
  "只输出 JSON，不要输出 Markdown、解释文字或额外前后缀。"
].join("\n");

export function buildDashboardAdvicePrompt(input: DashboardAdvicePromptInput) {
  return [
    "任务：生成主页 AI 建议。",
    "建议必须是只读建议，只能帮助用户判断下一步可以看什么或整理什么。",
    "不要写入数据库，不要生成 M4 预警，不要自动执行任何修改。",
    "建议类型只能是 organize、complete、relocate、consume、verify。",
    "类型含义：organize=整理，complete=补录，relocate=位置优化，consume=消耗建议，verify=信息核对。",
    `物品总数：${input.totalItems}`,
    `分类摘要：${formatTaxonomy(input.categories)}`,
    `位置摘要：${formatTaxonomy(input.locations)}`,
    `物品摘要：${JSON.stringify(input.items)}`,
    "返回结构必须符合 AI_DASHBOARD_ADVICE_JSON_SCHEMA，confidence 必须是 0 到 1 的小数。",
    "输出示例：",
    JSON.stringify({
      suggestions: [
        {
          action: "查看冰箱中的牛奶，确认本周是否需要优先消耗。",
          confidence: 0.82,
          reason: "牛奶有明确保质期，适合作为近期消耗建议。",
          relatedItemIds: [7],
          title: "优先处理牛奶",
          type: "consume"
        }
      ],
      warnings: []
    })
  ].join("\n");
}

export function parseAiDashboardAdviceResponse(input: unknown): ParseDashboardAdviceResult {
  const json = parseJsonInput(input);
  if (!json.ok) {
    return { message: "LLM 返回建议内容无法解析，请稍后重试。", ok: false };
  }
  if (!isRecord(json.value) || !Array.isArray(json.value.suggestions)) {
    return { message: "LLM 返回建议结构不正确，请稍后重试。", ok: false };
  }

  const warnings = readWarnings(json.value.warnings);
  const suggestions = readSuggestions(json.value.suggestions, warnings);
  return { data: { suggestions, warnings: uniqueWarnings(warnings) }, ok: true };
}

function readSuggestions(values: unknown[], warnings: string[]) {
  const suggestions: AiDashboardSuggestion[] = [];
  values.forEach((value, index) => {
    const suggestion = readSuggestion(value, index + 1, warnings);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  });
  return suggestions;
}

function readSuggestion(value: unknown, index: number, warnings: string[]) {
  if (!isRecord(value)) {
    warnings.push(`第 ${index} 条建议格式不正确，已忽略。`);
    return null;
  }

  const suggestion = buildSuggestion(value);
  if (!suggestion) {
    warnings.push(`第 ${index} 条建议缺少必要字段或类型不正确，已忽略。`);
    return null;
  }
  if (suggestion.confidence < 0.4) {
    warnings.push(`${suggestion.title} 的建议置信度较低，请人工判断。`);
  }
  return suggestion;
}

function buildSuggestion(value: Record<string, unknown>): AiDashboardSuggestion | null {
  const type = readAdviceType(value.type);
  const title = readText(value.title);
  const reason = readText(value.reason);
  const action = readText(value.action);
  const relatedItemIds = readRelatedItemIds(value.relatedItemIds);
  const confidence = readConfidence(value.confidence);
  return type && title && reason && action && relatedItemIds && confidence !== null
    ? { action, confidence, reason, relatedItemIds, title, type }
    : null;
}

function formatTaxonomy(values: DashboardAdviceTaxonomySummary[]) {
  return values.length ? values.map((value) => `${value.name}(${value.itemCount})`).join("、") : "暂无";
}

function readAdviceType(value: unknown): AiDashboardAdviceType | null {
  const types: readonly string[] = AI_DASHBOARD_ADVICE_TYPES;
  return typeof value === "string" && types.includes(value) ? (value as AiDashboardAdviceType) : null;
}

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readRelatedItemIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is number => Number.isInteger(item) && item > 0)
    : null;
}

function readConfidence(value: unknown) {
  if (typeof value !== "number" || value < 0) {
    return null;
  }
  if (value <= 1) {
    return value;
  }
  return value <= 100 ? Number((value / 100).toFixed(4)) : null;
}

function parseJsonInput(input: unknown): { ok: true; value: unknown } | { ok: false } {
  if (typeof input !== "string") {
    return { ok: true, value: input };
  }
  const jsonText = extractJsonText(input);
  if (!jsonText) {
    return { ok: false };
  }
  try {
    return { ok: true, value: JSON.parse(jsonText) };
  } catch {
    return { ok: false };
  }
}

function extractJsonText(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) {
    return fenced;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : null;
}

function readWarnings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function uniqueWarnings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
