import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/uploads/items/[id]/[filename]/route";
import { readItemImageFile } from "@/lib/api/images";

vi.mock("@/lib/api/images", () => ({
  handleApiError: vi.fn((error: unknown) => {
    const message = error instanceof Error ? error.message : "图片加载失败。";
    return Response.json({ code: 500, data: null, message }, { status: 500 });
  }),
  readItemImageFile: vi.fn()
}));

describe("upload file route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves stored item thumbnails through the protected uploads API", async () => {
    vi.mocked(readItemImageFile).mockResolvedValue({
      buffer: Buffer.from("jpeg-bytes"),
      mimeType: "image/jpeg"
    });

    const response = await GET(new Request("http://localhost/api/uploads/items/2/photo-thumb.jpg"), {
      params: Promise.resolve({ filename: "photo-thumb.jpg", id: "2" })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toBe("jpeg-bytes");
    expect(readItemImageFile).toHaveBeenCalledWith(2, "photo-thumb.jpg");
  });

  it("rejects invalid item ids before reading files", async () => {
    const response = await GET(new Request("http://localhost/api/uploads/items/nope/photo.jpg"), {
      params: Promise.resolve({ filename: "photo.jpg", id: "nope" })
    });

    expect(response.status).toBe(404);
    expect(readItemImageFile).not.toHaveBeenCalled();
  });
});
