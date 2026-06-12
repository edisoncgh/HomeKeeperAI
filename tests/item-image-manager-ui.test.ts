import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getDeleteImageConfirmationMessage, ItemImageManager } from "@/components/inventory/item-image-manager";

describe("ItemImageManager", () => {
  it("renders local upload and mobile camera controls", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(ItemImageManager, {
        images: [],
        isBusy: false,
        itemName: "牛奶",
        onDelete: async () => ({ ok: true }),
        onMove: async () => ({ ok: true }),
        onSetPrimary: async () => ({ ok: true }),
        onUpload: async () => ({ ok: true })
      })
    );

    expect(html).toContain("物品图片");
    expect(html).toContain("拍照");
    expect(html).toContain("上传");
    expect(html).toContain("capture=\"environment\"");
    expect(html).toContain("accept=\"image/*\"");
    expect(html).toContain("还没有图片");
  });

  it("renders existing image thumbnails with delete controls", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(ItemImageManager, {
        images: [
          {
            filename: "milk.jpg",
            id: 1,
            isPrimary: true,
            mimeType: "image/jpeg",
            size: 100,
            sortOrder: 0,
            thumbnailUrl: "/api/uploads/items/1/milk-thumb.jpg",
            url: "/api/uploads/items/1/milk.jpg"
          }
        ],
        isBusy: false,
        itemName: "牛奶",
        onDelete: async () => ({ ok: true }),
        onMove: async () => ({ ok: true }),
        onSetPrimary: async () => ({ ok: true }),
        onUpload: async () => ({ ok: true })
      })
    );

    expect(html).toContain("/api/uploads/items/1/milk-thumb.jpg");
    expect(html).toContain("删除图片");
  });

  it("renders primary badge, primary action, and ordering controls", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(ItemImageManager, {
        images: [
          {
            filename: "primary.jpg",
            id: 1,
            isPrimary: true,
            mimeType: "image/jpeg",
            size: 100,
            sortOrder: 0,
            thumbnailUrl: "/api/uploads/items/1/primary-thumb.jpg",
            url: "/api/uploads/items/1/primary.jpg"
          },
          {
            filename: "second.jpg",
            id: 2,
            isPrimary: false,
            mimeType: "image/jpeg",
            size: 100,
            sortOrder: 1,
            thumbnailUrl: "/api/uploads/items/1/second-thumb.jpg",
            url: "/api/uploads/items/1/second.jpg"
          }
        ],
        isBusy: false,
        itemName: "牛奶",
        onDelete: async () => ({ ok: true }),
        onMove: async () => ({ ok: true }),
        onSetPrimary: async () => ({ ok: true }),
        onUpload: async () => ({ ok: true })
      })
    );

    expect(html).toContain("主图");
    expect(html).toContain("设为主图");
    expect(html).toContain("上移图片");
    expect(html).toContain("下移图片");
  });

  it("uses explicit confirmation copy for primary image deletion", () => {
    const message = getDeleteImageConfirmationMessage({
      filename: "primary.jpg",
      id: 1,
      isPrimary: true,
      mimeType: "image/jpeg",
      size: 100,
      sortOrder: 0,
      thumbnailUrl: "/api/uploads/items/1/primary-thumb.jpg",
      url: "/api/uploads/items/1/primary.jpg"
    });

    expect(message).toContain("这张是当前主图");
    expect(message).toContain("系统会自动选择下一张图片作为主图");
  });
});
