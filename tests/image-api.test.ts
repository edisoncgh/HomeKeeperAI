import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    item: { findUnique: vi.fn(), update: vi.fn() },
    itemImage: {
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    $transaction: vi.fn()
  },
  storage: {
    deleteFile: vi.fn(),
    readStoredFile: vi.fn(),
    storeFile: vi.fn()
  },
  StorageValidationError: class StorageValidationError extends Error {}
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

vi.mock("@/lib/storage/local", () => ({
  buildItemUploadDir: vi.fn((id: number) => `/uploads/items/${id}`),
  buildPublicUrl: vi.fn((id: number, filename: string) => `/api/uploads/items/${id}/${filename}`),
  buildThumbnailFilename: vi.fn((filename: string) => filename.replace(/\.[^.]+$/, "-thumb.jpg")),
  deleteFile: mocks.storage.deleteFile,
  generateProcessedImageFilename: vi.fn(() => "test-uuid.jpg"),
  isPathSafe: vi.fn((filename: string) => !filename.includes("..")),
  readStoredFile: mocks.storage.readStoredFile,
  storeFile: mocks.storage.storeFile,
  StorageValidationError: mocks.StorageValidationError,
  validateFileSize: vi.fn((size: number) => size > 0 && size <= 10 * 1024 * 1024),
  validateMimeType: vi.fn((mime: string) => ["image/jpeg", "image/png", "image/webp"].includes(mime))
}));

import { deleteItemImage, getItemImages, moveItemImage, setPrimaryItemImage, uploadItemImage } from "@/lib/api/images";

describe("image API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        return arg(mocks.prisma);
      }
      return Promise.all(arg as Promise<unknown>[]);
    });
    mocks.prisma.itemImage.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  });

  describe("uploadItemImage", () => {
    it("rejects unauthenticated requests", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await expect(uploadItemImage(1, file)).rejects.toThrow("请先登录。");
    });

    it("rejects non-existent items", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue(null);

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await expect(uploadItemImage(999, file)).rejects.toThrow("物品不存在。");
    });

    it("rejects invalid mime types", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue({ id: 1 });

      const file = new File(["test"], "photo.gif", { type: "image/gif" });
      await expect(uploadItemImage(1, file)).rejects.toThrow("只支持 JPG、PNG、WebP 格式的图片。");
    });

    it("rejects oversized files", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue({ id: 1 });

      const largeBuffer = new ArrayBuffer(11 * 1024 * 1024);
      const file = new File([largeBuffer], "large.jpg", { type: "image/jpeg" });
      await expect(uploadItemImage(1, file)).rejects.toThrow("图片大小不能超过 10MB。");
    });

    it("uploads file and creates database record", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue({ id: 1 });
      mocks.prisma.itemImage.count.mockResolvedValue(0);
      mocks.storage.storeFile.mockResolvedValue({
        filename: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/uploads/items/1/test-uuid.jpg",
        thumbnailUrl: "/api/uploads/items/1/test-uuid-thumb.jpg"
      });
      mocks.prisma.itemImage.create.mockResolvedValue({
        id: 1,
        filename: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/uploads/items/1/test-uuid.jpg",
        thumbnailUrl: "/api/uploads/items/1/test-uuid-thumb.jpg",
        isPrimary: true,
        sortOrder: 0
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await uploadItemImage(1, file);

      expect(result).toMatchObject({
        id: 1,
        filename: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/uploads/items/1/test-uuid.jpg",
        thumbnailUrl: "/api/uploads/items/1/test-uuid-thumb.jpg",
        isPrimary: true,
        sortOrder: 0
      });
      expect(mocks.storage.storeFile).toHaveBeenCalledOnce();
      expect(mocks.prisma.item.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { imageUrl: "/api/uploads/items/1/test-uuid.jpg" }
      });
    });

    it("appends images after the maximum sort order instead of the raw image count", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue({ id: 1 });
      mocks.prisma.itemImage.count.mockResolvedValue(2);
      mocks.prisma.itemImage.aggregate.mockResolvedValue({ _max: { sortOrder: 3 } });
      mocks.storage.storeFile.mockResolvedValue({
        filename: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/uploads/items/1/test-uuid.jpg",
        thumbnailUrl: "/api/uploads/items/1/test-uuid-thumb.jpg"
      });
      mocks.prisma.itemImage.create.mockResolvedValue({
        id: 3,
        filename: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/uploads/items/1/test-uuid.jpg",
        thumbnailUrl: "/api/uploads/items/1/test-uuid-thumb.jpg",
        isPrimary: false,
        sortOrder: 4
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await uploadItemImage(1, file);

      expect(mocks.prisma.itemImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 4 })
        })
      );
    });

    it("cleans stored files when database creation fails", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue({ id: 1 });
      mocks.prisma.itemImage.count.mockResolvedValue(0);
      mocks.storage.storeFile.mockResolvedValue({
        filename: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/uploads/items/1/test-uuid.jpg",
        thumbnailUrl: "/api/uploads/items/1/test-uuid-thumb.jpg"
      });
      mocks.prisma.itemImage.create.mockRejectedValue(new Error("db failed"));

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await expect(uploadItemImage(1, file)).rejects.toThrow("db failed");

      expect(mocks.storage.deleteFile).toHaveBeenCalledWith("/uploads/items/1", "test-uuid.jpg");
      expect(mocks.storage.deleteFile).toHaveBeenCalledWith("/uploads/items/1", "test-uuid-thumb.jpg");
    });

    it("maps storage failures to image API errors", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.item.findUnique.mockResolvedValue({ id: 1 });
      mocks.storage.storeFile.mockRejectedValue(new Error("disk failed"));

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await expect(uploadItemImage(1, file)).rejects.toThrow("图片存储失败，请稍后重试。");
    });
  });

  describe("deleteItemImage", () => {
    it("rejects unauthenticated requests", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);

      await expect(deleteItemImage(1, 1)).rejects.toThrow("请先登录。");
    });

    it("rejects non-existent images", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findFirst.mockResolvedValue(null);

      await expect(deleteItemImage(1, 999)).rejects.toThrow("图片不存在。");
    });

    it("deletes file and database record", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findFirst.mockResolvedValue({
        id: 1,
        itemId: 1,
        filename: "test.jpg",
        isPrimary: true
      });
      mocks.storage.deleteFile.mockResolvedValue(true);
      mocks.prisma.itemImage.delete.mockResolvedValue({});
      mocks.prisma.itemImage.findFirst.mockResolvedValueOnce({
        id: 1,
        itemId: 1,
        filename: "test.jpg",
        isPrimary: true
      }).mockResolvedValueOnce(null);

      await deleteItemImage(1, 1);

      expect(mocks.storage.deleteFile).toHaveBeenCalledWith("/uploads/items/1", "test.jpg");
      expect(mocks.storage.deleteFile).toHaveBeenCalledWith("/uploads/items/1", "test-thumb.jpg");
      expect(mocks.prisma.itemImage.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mocks.prisma.item.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { imageUrl: null }
      });
    });

    it("keeps stored files when database deletion fails", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findFirst.mockResolvedValue({
        id: 1,
        itemId: 1,
        filename: "test.jpg",
        isPrimary: false
      });
      mocks.prisma.itemImage.delete.mockRejectedValue(new Error("db failed"));

      await expect(deleteItemImage(1, 1)).rejects.toThrow("db failed");

      expect(mocks.storage.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe("getItemImages", () => {
    it("rejects unauthenticated list requests", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);

      await expect(getItemImages(1)).rejects.toThrow("请先登录。");
    });

    it("returns images for item", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      const mockImages = [
        { id: 1, filename: "a.jpg", mimeType: "image/jpeg", size: 100, thumbnailUrl: "/a-thumb.jpg", url: "/a.jpg", isPrimary: true, sortOrder: 0 },
        { id: 2, filename: "b.jpg", mimeType: "image/jpeg", size: 200, thumbnailUrl: null, url: "/b.jpg", isPrimary: false, sortOrder: 1 }
      ];
      mocks.prisma.itemImage.findMany.mockResolvedValue(mockImages);

      const result = await getItemImages(1);

      expect(result).toHaveLength(2);
      expect(result[0].isPrimary).toBe(true);
      expect(result[0].thumbnailUrl).toBe("/a-thumb.jpg");
      expect(mocks.prisma.itemImage.findMany).toHaveBeenCalledWith({
        where: { itemId: 1 },
        orderBy: { sortOrder: "asc" }
      });
    });
  });

  describe("setPrimaryItemImage", () => {
    it("rejects unauthenticated requests", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);

      await expect(setPrimaryItemImage(1, 2)).rejects.toThrow("请先登录。");
    });

    it("sets one image as primary and syncs item imageUrl", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findFirst.mockResolvedValue({
        id: 2,
        itemId: 1,
        url: "/api/uploads/items/1/second.jpg"
      });
      mocks.prisma.itemImage.updateMany.mockResolvedValue({ count: 2 });
      mocks.prisma.itemImage.update.mockResolvedValue({});
      mocks.prisma.item.update.mockResolvedValue({});

      await setPrimaryItemImage(1, 2);

      expect(mocks.prisma.itemImage.updateMany).toHaveBeenCalledWith({
        data: { isPrimary: false },
        where: { itemId: 1 }
      });
      expect(mocks.prisma.itemImage.update).toHaveBeenCalledWith({
        data: { isPrimary: true },
        where: { id: 2 }
      });
      expect(mocks.prisma.item.update).toHaveBeenCalledWith({
        data: { imageUrl: "/api/uploads/items/1/second.jpg" },
        where: { id: 1 }
      });
    });

    it("rejects images outside the item", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findFirst.mockResolvedValue(null);

      await expect(setPrimaryItemImage(1, 99)).rejects.toThrow("图片不存在。");
    });
  });

  describe("moveItemImage", () => {
    it("rejects invalid direction", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

      await expect(moveItemImage(1, 2, "left")).rejects.toThrow("无效的排序方向。");
    });

    it("moves an image down by swapping sort order with the next image", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findMany.mockResolvedValue([
        { id: 1, itemId: 1, sortOrder: 0 },
        { id: 2, itemId: 1, sortOrder: 1 },
        { id: 3, itemId: 1, sortOrder: 2 }
      ]);
      mocks.prisma.itemImage.update.mockResolvedValue({});

      await moveItemImage(1, 2, "down");

      expect(mocks.prisma.itemImage.update).toHaveBeenCalledWith({
        data: { sortOrder: 2 },
        where: { id: 2 }
      });
      expect(mocks.prisma.itemImage.update).toHaveBeenCalledWith({
        data: { sortOrder: 1 },
        where: { id: 3 }
      });
    });

    it("keeps first image in place when moving up", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findMany.mockResolvedValue([
        { id: 1, itemId: 1, sortOrder: 0 },
        { id: 2, itemId: 1, sortOrder: 1 }
      ]);

      await moveItemImage(1, 1, "up");

      expect(mocks.prisma.itemImage.update).not.toHaveBeenCalled();
    });

    it("rejects moving a missing image", async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
      mocks.prisma.itemImage.findMany.mockResolvedValue([{ id: 1, itemId: 1, sortOrder: 0 }]);

      await expect(moveItemImage(1, 99, "down")).rejects.toThrow("图片不存在。");
    });
  });
});
