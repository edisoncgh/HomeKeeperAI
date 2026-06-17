import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { handleApiError, readItemImageFile } from "@/lib/api/images";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ filename: string; id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { filename, id } = await context.params;
    const itemId = Number(id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return apiError("图片不存在。", 404);
    }

    const result = await readItemImageFile(itemId, filename);
    if (!result) {
      return apiError("图片不存在。", 404);
    }

    const body = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Type": result.mimeType
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
