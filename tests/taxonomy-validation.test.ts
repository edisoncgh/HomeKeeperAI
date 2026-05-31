import { describe, expect, it } from "vitest";
import { parseTaxonomyInput } from "@/lib/validation/taxonomy";

describe("taxonomy input validation", () => {
  it("normalizes valid category and location input", () => {
    expect(
      parseTaxonomyInput({
        color: "  #4FBF8F  ",
        description: "  常用食材  ",
        icon: "  apple  ",
        name: "  食品  "
      })
    ).toEqual({
      data: {
        color: "#4FBF8F",
        description: "常用食材",
        icon: "apple",
        name: "食品"
      },
      ok: true
    });
  });

  it("converts empty optional fields to null", () => {
    expect(parseTaxonomyInput({ color: "", description: " ", icon: "", name: "厨房" })).toEqual({
      data: {
        color: null,
        description: null,
        icon: null,
        name: "厨房"
      },
      ok: true
    });
  });

  it("rejects missing or oversized names", () => {
    expect(parseTaxonomyInput({ name: " " })).toMatchObject({
      message: "名称不能为空。",
      ok: false
    });
    expect(parseTaxonomyInput({ name: "a".repeat(41) })).toMatchObject({
      message: "名称不能超过 40 个字符。",
      ok: false
    });
  });
});
