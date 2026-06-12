import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PhotoRecognitionPanel } from "@/components/ai";

describe("PhotoRecognitionPanel", () => {
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
});
