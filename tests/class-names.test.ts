import { describe, expect, it } from "vitest";
import { cn } from "@/lib/class-names";

describe("cn", () => {
  it("合并有效类名并跳过空值", () => {
    expect(cn("base", undefined, "active", false, null)).toBe("base active");
  });
});
