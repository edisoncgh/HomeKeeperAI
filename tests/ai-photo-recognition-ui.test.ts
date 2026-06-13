import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoRecognitionPanel, requestPhotoRecognition } from "@/components/ai";

describe("PhotoRecognitionPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the photo recognition entry with image input and manual fallback copy", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(PhotoRecognitionPanel, {
        categories: [{ id: 1, name: "食品" }],
        locations: [{ id: 2, name: "冰箱" }]
      })
    );

    expect(html).toContain("AI 拍照识别");
    expect(html).toContain("确认入库后会把本次图片保存到对应物品");
    expect(html).toContain("name=\"galleryImage\"");
    expect(html).toContain("accept=\"image/*\"");
    expect(html).toContain("name=\"userHint\"");
    expect(html).toContain("识别候选");
  });

  it("renders a mobile-only camera capture entry and a regular image picker fallback", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(PhotoRecognitionPanel, {
        categories: [{ id: 1, name: "食品" }],
        locations: [{ id: 2, name: "冰箱" }]
      })
    );

    expect(html).toContain("拍照导入");
    expect(html).toContain("从相册选择");
    expect(html).toContain("name=\"cameraImage\"");
    expect(html).toContain("capture=\"environment\"");
    expect(html).toContain("class=\"hidden md:hidden\"");
    expect(html).toMatch(/<button class="[^"]*md:hidden[^"]*" type="button"/);
    expect(html).toContain("name=\"galleryImage\"");
  });

  it("renders preview and recognition status regions for the selected image flow", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(PhotoRecognitionPanel, {
        categories: [{ id: 1, name: "食品" }],
        initialExpanded: true,
        locations: [{ id: 2, name: "冰箱" }]
      })
    );

    expect(html).toContain("图片预览");
    expect(html).toContain("选择图片后会在这里显示预览");
    expect(html).toContain("识别进度");
    expect(html).toContain("等待开始识别");
  });

  it("expands the panel when opened from the camera shortcut", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(PhotoRecognitionPanel, {
        autoOpenCameraToken: 1,
        categories: [{ id: 1, name: "食品" }],
        initialExpanded: false,
        locations: [{ id: 2, name: "冰箱" }]
      })
    );

    expect(html).toContain("拍照导入");
    expect(html).toContain("capture=\"environment\"");
    expect(html).toContain("图片预览");
    expect(html).toContain("识别候选");
  });

  it("returns a friendly error when the recognition request cannot reach the API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await requestPhotoRecognition("data:image/png;base64,abc", "", {
      categories: [{ id: 1, name: "食品" }],
      locations: [{ id: 2, name: "冰箱" }]
    });

    expect(result).toMatchObject({
      message: "网络异常，拍照识别失败，请稍后重试或手动添加物品。",
      ok: false
    });
  });
});
