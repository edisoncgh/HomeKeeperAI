export interface TaxonomyIconOption {
  emoji: string;
  label: string;
}

const categoryIconOptions: TaxonomyIconOption[] = [
  { emoji: "🍎", label: "食品" },
  { emoji: "🥛", label: "饮品" },
  { emoji: "🧴", label: "日用品" },
  { emoji: "🧼", label: "清洁" },
  { emoji: "🎁", label: "礼品" },
  { emoji: "💊", label: "药品" },
  { emoji: "🧸", label: "玩具" },
  { emoji: "📚", label: "文具" }
];

const locationIconOptions: TaxonomyIconOption[] = [
  { emoji: "🍳", label: "厨房" },
  { emoji: "🚿", label: "浴室" },
  { emoji: "📦", label: "储物间" },
  { emoji: "🚗", label: "车库" },
  { emoji: "🛋", label: "客厅" },
  { emoji: "🛏", label: "卧室" },
  { emoji: "🧊", label: "冰箱" },
  { emoji: "🌿", label: "阳台" }
];

export function getTaxonomyIconOptions(resourceLabel: "位置" | "分类") {
  return resourceLabel === "分类" ? categoryIconOptions : locationIconOptions;
}
