import { AI_ITEM_CANDIDATE_JSON_SCHEMA } from "@/lib/ai/schemas";

interface RecognitionPromptInput {
  categories: string[];
  locations: string[];
  userHint?: string;
}

interface OrderPromptInput {
  categories?: string[];
  locations?: string[];
  orderSource?: string;
}

export { AI_ITEM_CANDIDATE_JSON_SCHEMA };

export const AI_SYSTEM_PROMPT = [
  "你是家庭仓储管理系统的 AI 候选生成器。",
  "你的任务是只生成候选，帮助用户录入物品；不要直接写入、修改或删除正式物品。",
  "所有字段必须标记 source 和 confidence，source 只能是 image、order、inference、user。",
  "图片或订单中明确可见的信息优先使用 image 或 order；缺失信息可以用 inference 语义推断。",
  "使用 inference 时必须写 reason，说明为什么这样建议，例如香蕉可建议冰箱或约 1 周保质期。",
  "低置信度字段仍可输出，但必须让用户确认。",
  "只输出 JSON，不要输出 Markdown、解释文字或额外前后缀。"
].join("\n");

export function buildPhotoRecognitionPrompt(input: RecognitionPromptInput) {
  return [
    "任务：拍照识别家庭物品，并返回 AI 候选 JSON。",
    `现有分类：${formatList(input.categories)}`,
    `现有位置：${formatList(input.locations)}`,
    input.userHint ? `用户补充：${input.userHint}` : "用户补充：无",
    "优先把图片中可见的名称、数量、包装文字和保质期标记为 source: \"image\"。",
    "图片中没有出现的保质期、分类、位置，可以按物品语义推断为默认候选，标记为 source: \"inference\" 并写 reason。",
    "多件物品要拆成多个 candidates；无法确认的字段不要编造成 image 证据。",
    "返回结构必须符合 AI_ITEM_CANDIDATE_JSON_SCHEMA，confidence 必须是 0 到 1 的小数，不要用百分比。",
    "输出示例：",
    JSON.stringify({
      candidates: [
        {
          categoryName: { confidence: 0.8, reason: "香蕉通常按食品管理。", source: "inference", value: "食品" },
          expiryDays: { confidence: 0.7, reason: "图片未显示保质期，按常见保存时间估计。", source: "inference", value: 7 },
          name: { confidence: 0.9, source: "image", value: "香蕉" },
          quantity: { confidence: 0.6, source: "image", value: 1 }
        }
      ],
      warnings: []
    })
  ].join("\n");
}

export function buildOrderParsingPrompt(input: OrderPromptInput = {}) {
  return [
    "任务：解析订单截图，并返回 AI 候选 JSON。",
    `订单来源：${input.orderSource?.trim() || "未知"}`,
    `现有分类：${formatList(input.categories ?? [])}`,
    `现有位置：${formatList(input.locations ?? [])}`,
    "订单截图中可见的商品名、数量、价格、采购日期必须优先标记为 source: \"order\"。",
    "订单截图缺失的分类、位置、保质期可以按物品语义推断，标记为 source: \"inference\" 并写 reason。",
    "同一订单中的多个商品要拆成多个 candidates；赠品或组合装不确定时写入 warnings。",
    "返回结构必须符合 AI_ITEM_CANDIDATE_JSON_SCHEMA，confidence 必须是 0 到 1 的小数，不要用百分比。",
    "输出示例：",
    JSON.stringify({
      candidates: [
        {
          categoryName: { confidence: 0.76, reason: "牛奶通常按食品管理。", source: "inference", value: "食品" },
          name: { confidence: 0.92, source: "order", value: "牛奶" },
          purchaseDate: { confidence: 0.82, source: "order", value: "2026-06-02" },
          purchasePrice: { confidence: 0.84, source: "order", value: 18.9 },
          quantity: { confidence: 0.88, source: "order", value: 2 }
        }
      ],
      warnings: []
    })
  ].join("\n");
}

function formatList(values: string[]) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return normalized.length ? normalized.join("、") : "暂无";
}
