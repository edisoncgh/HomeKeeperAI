import { describe, expect, it } from "vitest";
import {
  generateSafeFilename,
  isPathSafe,
  validateMimeType,
  validateFileSize,
  buildPublicUrl,
  buildItemUploadDir,
  buildThumbnailFilename,
  processImage,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_PIXELS
} from "@/lib/storage/local";

describe("image storage validation", () => {
  describe("validateMimeType", () => {
    it("accepts allowed mime types", () => {
      for (const mime of ALLOWED_MIME_TYPES) {
        expect(validateMimeType(mime)).toBe(true);
      }
    });

    it("rejects disallowed mime types", () => {
      expect(validateMimeType("image/gif")).toBe(false);
      expect(validateMimeType("application/pdf")).toBe(false);
      expect(validateMimeType("text/plain")).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("accepts valid file sizes", () => {
      expect(validateFileSize(1024)).toBe(true);
      expect(validateFileSize(MAX_FILE_SIZE)).toBe(true);
    });

    it("rejects zero or negative size", () => {
      expect(validateFileSize(0)).toBe(false);
      expect(validateFileSize(-1)).toBe(false);
    });

    it("rejects oversized files", () => {
      expect(validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
    });
  });

  describe("generateSafeFilename", () => {
    it("generates unique filenames", () => {
      const name1 = generateSafeFilename("photo.jpg");
      const name2 = generateSafeFilename("photo.jpg");
      expect(name1).not.toBe(name2);
    });

    it("preserves extension", () => {
      const name = generateSafeFilename("photo.jpg");
      expect(name).toMatch(/\.jpg$/);
    });

    it("handles filenames without extension", () => {
      const name = generateSafeFilename("photo");
      expect(name).not.toContain(".");
    });

    it("lowercases extension", () => {
      const name = generateSafeFilename("photo.JPG");
      expect(name).toMatch(/\.jpg$/);
    });
  });

  describe("isPathSafe", () => {
    it("accepts safe filenames", () => {
      expect(isPathSafe("photo.jpg")).toBe(true);
      expect(isPathSafe("my-photo_2024.png")).toBe(true);
    });

    it("rejects path traversal attempts", () => {
      expect(isPathSafe("../photo.jpg")).toBe(false);
      expect(isPathSafe("../../etc/passwd")).toBe(false);
      expect(isPathSafe("subdir/../../photo.jpg")).toBe(false);
    });

    it("rejects absolute paths", () => {
      expect(isPathSafe("/etc/passwd")).toBe(false);
      expect(isPathSafe("C:\\Windows\\System32\\config")).toBe(false);
    });

    it("rejects nested paths inside the upload directory", () => {
      expect(isPathSafe("nested/photo.jpg")).toBe(false);
      expect(isPathSafe("nested\\photo.jpg")).toBe(false);
    });
  });

  describe("buildPublicUrl", () => {
    it("builds correct URL", () => {
      const url = buildPublicUrl(42, "abc-123.jpg");
      expect(url).toBe("/api/uploads/items/42/abc-123.jpg");
    });
  });

  describe("buildItemUploadDir", () => {
    it("builds correct directory path", () => {
      const dir = buildItemUploadDir(42);
      expect(dir).toContain("uploads");
      expect(dir).toContain("items");
      expect(dir).toContain("42");
    });
  });

  describe("buildThumbnailFilename", () => {
    it("builds thumbnail names for files with and without extensions", () => {
      expect(buildThumbnailFilename("photo.jpg")).toBe("photo-thumb.jpg");
      expect(buildThumbnailFilename("uuid")).toBe("uuid-thumb.jpg");
    });
  });

describe("image processing", () => {
  it("processImage returns processed and thumbnail buffers", async () => {
    // Create a minimal valid JPEG buffer
    const { default: sharp } = await import("sharp");
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .jpeg()
      .toBuffer();

    const result = await processImage(buffer);

    expect(result.processed).toBeInstanceOf(Buffer);
    expect(result.thumbnail).toBeInstanceOf(Buffer);
    expect(result.processed.length).toBeGreaterThan(0);
    expect(result.thumbnail.length).toBeGreaterThan(0);
  });

  it("processImage respects custom options", async () => {
    const { default: sharp } = await import("sharp");
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .jpeg()
      .toBuffer();

    const result = await processImage(buffer, {
      maxWidth: 50,
      maxHeight: 50,
      thumbnailWidth: 25,
      thumbnailHeight: 25
    });

    expect(result.processed).toBeInstanceOf(Buffer);
    expect(result.thumbnail).toBeInstanceOf(Buffer);
  });

  it("rejects images whose pixel count is too large", async () => {
    const side = Math.ceil(Math.sqrt(MAX_IMAGE_PIXELS)) + 1;
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}"></svg>`);

    await expect(processImage(svg)).rejects.toThrow("图片分辨率不能超过 8192x8192。");
  });
});
});
