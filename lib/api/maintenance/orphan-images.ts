import { apiError, apiOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanImages, scanOrphanImages } from "@/lib/storage/orphan-images";

class MaintenanceApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "MaintenanceApiError";
  }
}

export async function scanOrphanImageFiles() {
  await requireMaintenanceAdmin();

  const referencedUrls = await getReferencedImageUrls();
  return scanOrphanImages({ referencedUrls });
}

export async function cleanupOrphanImageFiles(input: { confirm: boolean }) {
  await requireMaintenanceAdmin();
  if (!input.confirm) {
    throw new MaintenanceApiError("请先确认清理孤儿图片。", 400);
  }

  const scan = await scanOrphanImageFiles();
  return cleanupOrphanImages({ files: scan.files });
}

export function handleMaintenanceApiError(error: unknown) {
  if (error instanceof MaintenanceApiError) {
    return apiError(error.message, error.statusCode);
  }

  return apiError("维护操作失败，请稍后重试。", 500);
}

export function okMaintenance(data: unknown, status = 200) {
  return apiOk(data, status);
}

async function requireMaintenanceAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new MaintenanceApiError("请先登录。", 401);
  }
  if (user.role !== "ADMIN") {
    throw new MaintenanceApiError("需要管理员权限。", 403);
  }
}

async function getReferencedImageUrls() {
  const images = await prisma.itemImage.findMany({
    select: { thumbnailUrl: true, url: true }
  });
  const urls = new Set<string>();

  for (const image of images) {
    urls.add(image.url);
    if (image.thumbnailUrl) {
      urls.add(image.thumbnailUrl);
    }
  }

  return urls;
}
