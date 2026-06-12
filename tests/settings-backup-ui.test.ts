import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackupMaintenancePanel, fetchBackupJson } from "@/components/settings/backup-maintenance-panel";

describe("BackupMaintenancePanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders backup actions and existing backup summaries", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(BackupMaintenancePanel, {
        initialBackups: [
          {
            createdAt: "2026-06-06T12:34:56.000Z",
            fileName: "home-storage-20260606-123456.db",
            id: "home-storage-20260606-123456.db",
            includesUploads: true,
            sizeBytes: 2048,
            uploadFileCount: 2,
            uploadSizeBytes: 4096
          }
        ]
      })
    );

    expect(html).toContain("数据备份");
    expect(html).toContain("创建备份");
    expect(html).toContain("home-storage-20260606-123456.db");
    expect(html).toContain("2 KB");
    expect(html).toContain("图片 2 个");
    expect(html).toContain("4 KB");
    expect(html).toContain("恢复");
    expect(html).toContain("删除");
  });

  it("renders an empty backup state", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(BackupMaintenancePanel, { initialBackups: [] }));

    expect(html).toContain("还没有备份");
  });

  it("converts network failures into a failed backup response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    const response = await fetchBackupJson("/api/backups");

    expect(response).toEqual({
      message: "请求失败，请稍后重试。",
      ok: false
    });
  });
});
