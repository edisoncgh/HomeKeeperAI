import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { getItemImages, handleApiError, uploadItemImage } from "@/lib/api/images";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = Number(id);
    if (isNaN(itemId) || itemId <= 0) {
      return apiError("无效的物品 ID。", 400);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return apiError("请选择要上传的图片。", 400);
    }

    const result = await uploadItemImage(itemId, file);
    return apiOk(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = Number(id);
    if (isNaN(itemId) || itemId <= 0) {
      return apiError("无效的物品 ID。", 400);
    }

    const images = await getItemImages(itemId);
    return apiOk(images);
  } catch (error) {
    return handleApiError(error);
  }
}
