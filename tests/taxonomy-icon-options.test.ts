import { describe, expect, it } from "vitest";
import { getTaxonomyIconOptions } from "@/lib/inventory/taxonomy-icon-options";

describe("getTaxonomyIconOptions", () => {
  it("offers semantic emoji suggestions for categories", () => {
    const options = getTaxonomyIconOptions("分类");
    const labels = options.map((option) => `${option.emoji} ${option.label}`);

    expect(labels).toContain("🍎 食品");
    expect(labels).toContain("🧴 日用品");
    expect(labels).toContain("🎁 礼品");
  });

  it("offers semantic emoji suggestions for locations", () => {
    const options = getTaxonomyIconOptions("位置");
    const labels = options.map((option) => `${option.emoji} ${option.label}`);

    expect(labels).toContain("🍳 厨房");
    expect(labels).toContain("🚿 浴室");
    expect(labels).toContain("📦 储物间");
    expect(labels).toContain("🚗 车库");
  });
});
