import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchOrphanImageMaintenanceJson,
  OrphanImageMaintenancePanel
} from "@/components/settings/orphan-image-maintenance-panel";

describe("OrphanImageMaintenancePanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a safe scan-first maintenance flow", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(OrphanImageMaintenancePanel));

    expect(html).toContain("孤儿图片清理");
    expect(html).toContain("id=\"orphan-images\"");
    expect(html).toContain("先扫描 uploads 与数据库引用，再确认清理。");
    expect(html).toContain("扫描孤儿图片");
    expect(html).toContain("确认清理");
    expect(html).toContain("清理前会重新扫描，避免删除刚被引用的图片。");
  });

  it("converts network failures into a failed maintenance response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    const response = await fetchOrphanImageMaintenanceJson("/api/maintenance/orphan-images");

    expect(response).toEqual({
      message: "请求失败，请稍后重试。",
      ok: false
    });
  });
});
