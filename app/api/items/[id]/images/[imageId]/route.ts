import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { deleteItemImage, handleApiError, moveItemImage, setPrimaryItemImage } from "@/lib/api/images";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const itemId = Number(id);
    const imageIdNum = Number(imageId);
    if (isNaN(itemId) || itemId <= 0 || isNaN(imageIdNum) || imageIdNum <= 0) {
      return apiError("无效的 ID。", 400);
    }

    await deleteItemImage(itemId, imageIdNum);
    return apiOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const itemId = Number(id);
    const imageIdNum = Number(imageId);
    if (isNaN(itemId) || itemId <= 0 || isNaN(imageIdNum) || imageIdNum <= 0) {
      return apiError("无效的 ID。", 400);
    }

    const payload = (await request.json().catch(() => null)) as { action?: string; direction?: string } | null;
    if (!payload) {
      return apiError("请求体不是合法的 JSON。", 400);
    }
    if (payload?.action === "setPrimary") {
      await setPrimaryItemImage(itemId, imageIdNum);
      return apiOk({ success: true });
    }

    if (payload?.action === "move") {
      await moveItemImage(itemId, imageIdNum, payload.direction ?? "");
      return apiOk({ success: true });
    }

    return apiError("无效的图片操作。", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
