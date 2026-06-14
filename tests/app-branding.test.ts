import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

describe("app branding", () => {
  it("uses the 爱管家 product name in root metadata", () => {
    const layout = readFileSync(join(rootDir, "app", "layout.tsx"), "utf8");

    expect(layout).toContain('title: "爱管家"');
    expect(layout).toContain("爱管家，面向家庭局域网和 NAS 部署");
  });

  it("provides a modern favicon that carries the home, steward, and AI-love ideas", () => {
    const icon = readFileSync(join(rootDir, "app", "icon.svg"), "utf8");

    expect(icon).toContain('viewBox="0 0 512 512"');
    expect(icon).toContain("#4fbf8f");
    expect(icon).toContain("<path");
    expect(icon).toContain("<circle");
  });
});
