import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
const UPLOAD_ROOT = process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "uploads");

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_PIXELS = 8192 * 8192;
export const PROCESSED_IMAGE_MIME_TYPE = "image/jpeg";

export interface StoredFile {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export function getUploadRoot(): string {
  return UPLOAD_ROOT;
}

export function buildItemUploadDir(itemId: number): string {
  return path.join(UPLOAD_ROOT, "items", String(itemId));
}

export function buildPublicUrl(itemId: number, filename: string): string {
  return `/api/uploads/items/${itemId}/${filename}`;
}

export function buildThumbnailFilename(filename: string): string {
  return filename.includes(".") ? filename.replace(/\.[^.]+$/, "-thumb.jpg") : `${filename}-thumb.jpg`;
}

export function validateMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85,
  thumbnailWidth: 300,
  thumbnailHeight: 300
};

export async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<{ processed: Buffer; thumbnail: Buffer }> {
  const { default: sharp } = await import("sharp");
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new StorageValidationError("无法解析图片尺寸，文件可能已损坏。");
  }
  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new StorageValidationError("图片分辨率不能超过 8192x8192。");
  }
  
  const processed = await sharp(buffer)
    .resize(opts.maxWidth, opts.maxHeight, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: opts.quality })
    .toBuffer();
  
  const thumbnail = await sharp(buffer)
    .resize(opts.thumbnailWidth, opts.thumbnailHeight, { fit: "cover" })
    .jpeg({ quality: 80 })
    .toBuffer();
  
  return { processed, thumbnail };
}

export function generateSafeFilename(originalName: string): string {
  const ext = getExtensionFromName(originalName);
  const uuid = randomUUID();
  return ext ? `${uuid}.${ext}` : uuid;
}

export function generateProcessedImageFilename(): string {
  return `${randomUUID()}.jpg`;
}

function getExtensionFromName(name: string): string {
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) return "";
  return match[1].toLowerCase();
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function storeFile(
  dir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string,
  options?: ImageProcessingOptions
): Promise<StoredFile> {
  if (!isPathSafe(filename)) {
    throw new StorageValidationError("文件名包含非法字符。");
  }

  await ensureDir(dir);
  
  const { processed, thumbnail } = await processImage(buffer, options);
  
  const filePath = path.join(dir, filename);
  const thumbnailFilename = buildThumbnailFilename(filename);
  const thumbnailPath = path.join(dir, thumbnailFilename);
  const itemId = extractItemIdFromDir(dir);
  
  try {
    await writeFile(filePath, processed);
    await writeFile(thumbnailPath, thumbnail);
  } catch (error) {
    await cleanupPartialStore(filePath, thumbnailPath);
    throw error;
  }
  
  return {
    filename,
    mimeType: PROCESSED_IMAGE_MIME_TYPE,
    size: processed.length,
    url: buildPublicUrl(itemId, filename),
    thumbnailUrl: buildPublicUrl(itemId, thumbnailFilename)
  };
}

function extractItemIdFromDir(dir: string): number {
  const parts = dir.split(path.sep);
  const idx = parts.lastIndexOf("items");
  const itemId = idx === -1 || idx + 1 >= parts.length ? NaN : Number(parts[idx + 1]);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("图片存储目录缺少合法物品 ID。");
  }
  return itemId;
}

export async function deleteFile(dir: string, filename: string): Promise<boolean> {
  if (!isPathSafe(filename)) {
    return false;
  }
  const filePath = path.join(dir, filename);
  try {
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readStoredFile(dir: string, filename: string): Promise<Buffer | null> {
  if (!isPathSafe(filename)) {
    return null;
  }

  try {
    return await readFile(path.join(dir, filename));
  } catch {
    return null;
  }
}

export async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);
    return entries;
  } catch {
    return [];
  }
}

export async function fileExists(dir: string, filename: string): Promise<boolean> {
  if (!isPathSafe(filename)) {
    return false;
  }
  const filePath = path.join(dir, filename);
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export function isPathSafe(filename: string): boolean {
  const normalized = path.normalize(filename);
  return normalized !== "." && normalized === path.basename(normalized) && !normalized.includes("..") && !path.isAbsolute(normalized);
}

async function cleanupPartialStore(filePath: string, thumbnailPath: string) {
  for (const targetPath of [thumbnailPath, filePath]) {
    try {
      await unlink(targetPath);
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        console.warn("清理未完成图片写入失败:", error instanceof Error ? error.message : error);
      }
    }
  }
}

function isFileNotFoundError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
