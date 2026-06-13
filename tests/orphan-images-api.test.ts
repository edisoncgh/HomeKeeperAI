import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cleanupOrphanImages: vi.fn(),
  getCurrentUser: vi.fn(),
  prisma: {
    itemImage: { findMany: vi.fn() }
  },
  scanOrphanImages: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/storage/orphan-images", () => ({
  cleanupOrphanImages: mocks.cleanupOrphanImages,
  scanOrphanImages: mocks.scanOrphanImages
}));

import { POST as cleanupOrphanImagesPost } from "@/app/api/maintenance/orphan-images/cleanup/route";
import { cleanupOrphanImageFiles, scanOrphanImageFiles } from "@/lib/api/maintenance/orphan-images";

describe("orphan image maintenance API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated scans", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(scanOrphanImageFiles()).rejects.toThrow("请先登录。");
  });

  it("rejects member users from maintenance operations", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 2, role: "MEMBER" });

    await expect(scanOrphanImageFiles()).rejects.toThrow("需要管理员权限。");
    await expect(cleanupOrphanImageFiles({ confirm: true })).rejects.toThrow("需要管理员权限。");
  });

  it("passes referenced image URLs to the storage scanner", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, role: "ADMIN" });
    mocks.prisma.itemImage.findMany.mockResolvedValue([
      { thumbnailUrl: "/api/uploads/items/1/a-thumb.jpg", url: "/api/uploads/items/1/a.jpg" }
    ]);
    mocks.scanOrphanImages.mockResolvedValue({ files: [], summary: { fileCount: 0, totalBytes: 0 } });

    await scanOrphanImageFiles();

    const scannerArg = mocks.scanOrphanImages.mock.calls[0][0];
    expect(scannerArg.referencedUrls.has("/api/uploads/items/1/a.jpg")).toBe(true);
    expect(scannerArg.referencedUrls.has("/api/uploads/items/1/a-thumb.jpg")).toBe(true);
  });

  it("requires explicit confirmation before cleanup", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, role: "ADMIN" });

    await expect(cleanupOrphanImageFiles({ confirm: false })).rejects.toThrow("请先确认清理孤儿图片。");
  });

  it("cleans orphan images through the confirmed cleanup route", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, role: "ADMIN" });
    mocks.prisma.itemImage.findMany.mockResolvedValue([]);
    mocks.scanOrphanImages.mockResolvedValue({
      files: [{ fileName: "orphan.jpg", itemId: 1, relativePath: "items/1/orphan.jpg", sizeBytes: 6 }],
      summary: { fileCount: 1, totalBytes: 6 }
    });
    mocks.cleanupOrphanImages.mockResolvedValue({
      deletedCount: 1,
      results: [{ file: "items/1/orphan.jpg", status: "deleted" }],
      skippedCount: 0
    });

    const response = await cleanupOrphanImagesPost(
      new Request("http://localhost/api/maintenance/orphan-images/cleanup", {
        body: JSON.stringify({ confirm: true }),
        headers: { "content-type": "application/json" },
        method: "POST"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.deletedCount).toBe(1);
  });
});
