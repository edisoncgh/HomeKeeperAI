import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SettingsMaintenanceHub } from "@/components/settings/settings-maintenance-hub";

describe("SettingsMaintenanceHub", () => {
  it("renders management and maintenance destinations", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(SettingsMaintenanceHub));

    expect(html).toContain("资料管理");
    expect(html).toContain("分类管理");
    expect(html).toContain("位置管理");
    expect(html).toContain("维护工具");
    expect(html).toContain("孤儿图片清理");
    expect(html).toContain("href=\"/categories\"");
    expect(html).toContain("href=\"/locations\"");
    expect(html).toContain("href=\"#orphan-images\"");
  });
});
