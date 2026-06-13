import { apiError } from "@/lib/api/response";
import { findItemDetail, type ItemDetailView } from "@/lib/api/items";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  buildItemUploadDir,
  buildThumbnailFilename,
  deleteFile,
  generateProcessedImageFilename,
  isPathSafe,
  readStoredFile,
  storeFile,
  StorageValidationError,
  validateFileSize,
  validateMimeType
} from "@/lib/storage/local";

export interface ImageUploadResult {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ImageMutationResult {
  item: ItemDetailView;
}

export async function uploadItemImage(
  itemId: number,
  file: File
): Promise<ImageMutationResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("请先登录。", 401);
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new ApiError("物品不存在。", 404);
  }

  if (!validateMimeType(file.type)) {
    throw new ApiError("只支持 JPG、PNG、WebP 格式的图片。", 400);
  }

  if (!validateFileSize(file.size)) {
    throw new ApiError("图片大小不能超过 10MB。", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateProcessedImageFilename();
  const dir = buildItemUploadDir(itemId);
  let stored: Awaited<ReturnType<typeof storeFile>>;
  try {
    stored = await storeFile(dir, filename, buffer, file.type);
  } catch (error) {
    throw toImageStorageApiError(error);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const imageCount = await tx.itemImage.count({ where: { itemId } });
      const isFirst = imageCount === 0;
      const maxSort = await tx.itemImage.aggregate({
        _max: { sortOrder: true },
        where: { itemId }
      });
      const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;

      await tx.itemImage.create({
        data: {
          itemId,
          filename: stored.filename,
          originalName: file.name,
          mimeType: stored.mimeType,
          size: stored.size,
          url: stored.url,
          thumbnailUrl: stored.thumbnailUrl,
          isPrimary: isFirst,
          sortOrder: nextSortOrder
        }
      });

      if (isFirst) {
        await tx.item.update({
          where: { id: itemId },
          data: { imageUrl: stored.url }
        });
      }
    });
  } catch (error) {
    await cleanupStoredImageFiles(itemId, stored.filename);
    throw error;
  }

  return readMutatedItem(itemId);
}

export async function deleteItemImage(
  itemId: number,
  imageId: number
): Promise<ImageMutationResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("请先登录。", 401);
  }

  const image = await prisma.itemImage.findFirst({
    where: { id: imageId, itemId }
  });
  if (!image) {
    throw new ApiError("图片不存在。", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextPrimary = await tx.itemImage.findFirst({
        where: { itemId },
        orderBy: { sortOrder: "asc" }
      });
      if (nextPrimary) {
        await tx.itemImage.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true }
        });
        await tx.item.update({
          where: { id: itemId },
          data: { imageUrl: nextPrimary.url }
        });
      } else {
        await tx.item.update({
          where: { id: itemId },
          data: { imageUrl: null }
        });
      }
    }
  });

  await cleanupStoredImageFiles(itemId, image.filename);
  return readMutatedItem(itemId);
}

export async function setPrimaryItemImage(itemId: number, imageId: number): Promise<ImageMutationResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("请先登录。", 401);
  }

  const image = await prisma.itemImage.findFirst({
    where: { id: imageId, itemId }
  });
  if (!image) {
    throw new ApiError("图片不存在。", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemImage.updateMany({
      data: { isPrimary: false },
      where: { itemId }
    });
    await tx.itemImage.update({
      data: { isPrimary: true },
      where: { id: imageId }
    });
    await tx.item.update({
      data: { imageUrl: image.url },
      where: { id: itemId }
    });
  });
  return readMutatedItem(itemId);
}

export async function moveItemImage(
  itemId: number,
  imageId: number,
  direction: string
): Promise<ImageMutationResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("请先登录。", 401);
  }

  if (direction !== "up" && direction !== "down") {
    throw new ApiError("无效的排序方向。", 400);
  }

  const images = await prisma.itemImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    where: { itemId }
  });
  const currentIndex = images.findIndex((image) => image.id === imageId);
  if (currentIndex === -1) {
    throw new ApiError("图片不存在。", 404);
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const targetImage = images[targetIndex];
  if (!targetImage) {
    return readMutatedItem(itemId);
  }

  const currentImage = images[currentIndex];
  await prisma.$transaction(async (tx) => {
    await tx.itemImage.update({
      data: { sortOrder: targetImage.sortOrder },
      where: { id: currentImage.id }
    });
    await tx.itemImage.update({
      data: { sortOrder: currentImage.sortOrder },
      where: { id: targetImage.id }
    });
  });
  return readMutatedItem(itemId);
}

export async function getItemImages(itemId: number): Promise<ImageUploadResult[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("请先登录。", 401);
  }

  const images = await prisma.itemImage.findMany({
    where: { itemId },
    orderBy: { sortOrder: "asc" }
  });
  return images.map((img) => ({
    id: img.id,
    filename: img.filename,
    mimeType: img.mimeType,
    size: img.size,
    url: img.url,
    thumbnailUrl: img.thumbnailUrl ?? undefined,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder
  }));
}

export async function readItemImageFile(
  itemId: number,
  filename: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("请先登录。", 401);
  }

  if (!isPathSafe(filename)) {
    throw new ApiError("图片不存在。", 404);
  }

  const url = `/api/uploads/items/${itemId}/${filename}`;
  const image = await prisma.itemImage.findFirst({
    where: {
      itemId,
      OR: [{ filename }, { thumbnailUrl: url }]
    }
  });
  if (!image) {
    throw new ApiError("图片不存在。", 404);
  }

  const buffer = await readStoredFile(buildItemUploadDir(itemId), filename);
  if (!buffer) {
    throw new ApiError("图片文件不存在。", 404);
  }

  return {
    buffer,
    mimeType: image.filename === filename ? image.mimeType : "image/jpeg"
  };
}

async function cleanupStoredImageFiles(itemId: number, filename: string) {
  try {
    const dir = buildItemUploadDir(itemId);
    const thumbnailFilename = buildThumbnailFilename(filename);
    await Promise.all([deleteFile(dir, filename), deleteFile(dir, thumbnailFilename)]);
  } catch (error) {
    console.warn("清理图片文件失败:", error instanceof Error ? error.message : error);
  }
}

async function readMutatedItem(itemId: number) {
  const item = await findItemDetail(itemId);
  if (!item) {
    throw new ApiError("物品不存在。", 404);
  }

  return { item };
}

function toImageStorageApiError(error: unknown) {
  if (error instanceof StorageValidationError) {
    return new ApiError(error.message, 400);
  }

  return new ApiError("图片存储失败，请稍后重试。", 500);
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return apiError(error.message, error.statusCode);
  }
  console.error("Image API error:", error instanceof Error ? error.message : error);
  return apiError("图片操作失败，请稍后重试。", 500);
}
