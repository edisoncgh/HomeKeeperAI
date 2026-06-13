import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout";

let mockedPathname = "/items";
let mockedSearchParams = "mode=camera";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    createElement("a", { ...props, href }, children)
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mockedSearchParams)
}));

describe("AppShell mobile camera shortcut", () => {
  it("renders the bottom photo action as a real camera input trigger", () => {
    mockedPathname = "/items";
    mockedSearchParams = "mode=camera";
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(AppShell, null, createElement("div", null, "content")));

    expect(html).toContain("name=\"cameraShortcutImage\"");
    expect(html).toContain("capture=\"environment\"");
    expect(html).toContain("type=\"button\"");
    expect(html).toContain("拍照");
  });

  it("keeps the settings bottom navigation item inside a safe-area aware viewport bar", () => {
    mockedPathname = "/settings";
    mockedSearchParams = "";
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(AppShell, null, createElement("div", null, "content")));

    expect(html).toContain("min-h-[100dvh] overflow-x-hidden");
    expect(html).toContain("pb-[calc(6rem+env(safe-area-inset-bottom))]");
    expect(html).toContain("h-[calc(4rem+env(safe-area-inset-bottom))]");
    expect(html).toContain("grid-cols-5");
    expect(html).toContain("max-w-[4.25rem]");
    expect(html).toContain("href=\"/settings\"");
    expect(html).toContain("aria-current=\"page\"");
  });

  it("keeps the alert active tab and photo action in separate compact slots", () => {
    mockedPathname = "/alerts";
    mockedSearchParams = "";
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(AppShell, null, createElement("div", null, "content")));

    expect(html).toContain("href=\"/alerts\"");
    expect(html).toContain("h-14 w-[4.25rem]");
    expect(html).toContain("rounded-[18px]");
    expect(html).toContain("max-w-[4.25rem]");
    expect(html).not.toContain("size-20");
    expect(html).not.toContain("rounded-full");
  });
});
