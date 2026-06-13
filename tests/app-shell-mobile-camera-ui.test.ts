import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    createElement("a", { ...props, href }, children)
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/items",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("mode=camera")
}));

describe("AppShell mobile camera shortcut", () => {
  it("renders the bottom photo action as a real camera input trigger", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(AppShell, null, createElement("div", null, "content")));

    expect(html).toContain("name=\"cameraShortcutImage\"");
    expect(html).toContain("capture=\"environment\"");
    expect(html).toContain("type=\"button\"");
    expect(html).toContain("拍照");
  });
});
