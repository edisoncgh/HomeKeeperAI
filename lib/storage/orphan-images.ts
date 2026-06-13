import { lstat, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { buildPublicUrl, getUploadRoot, isPathSafe } from "@/lib/storage/local";

export interface OrphanImageFile {
  filename: string;
  itemId: number;
  relativePath: string;
  sizeBytes: number;
}

export interface OrphanImageScanResult {
  files: OrphanImageFile[];
  summary: {
    fileCount: number;
    totalBytes: number;
  };
}

export async function scanOrphanImages(options: {
  referencedUrls: Set<string>;
  uploadRoot?: string;
}): Promise<OrphanImageScanResult> {
  const uploadRoot = options.uploadRoot ?? getUploadRoot();
  const itemsRoot = path.join(uploadRoot, "items");
  const files: OrphanImageFile[] = [];
  const itemDirs = await safeReadDir(itemsRoot);

  for (const dirent of itemDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const itemId = Number(dirent.name);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      continue;
    }

    const itemDir = path.join(itemsRoot, dirent.name);
    const entries = await safeReadDir(itemDir);
    for (const entry of entries) {
      if (!entry.isFile() || !isPathSafe(entry.name)) {
        continue;
      }

      const absolutePath = path.join(itemDir, entry.name);
      const fileStat = await safeLstat(absolutePath);
      if (!fileStat || fileStat.isSymbolicLink() || !fileStat.isFile()) {
        continue;
      }

      const url = buildPublicUrl(itemId, entry.name);
      if (options.referencedUrls.has(url)) {
        continue;
      }

      files.push({
        filename: entry.name,
        itemId,
        relativePath: path.posix.join("items", String(itemId), entry.name),
        sizeBytes: fileStat.size
      });
    }
  }

  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return {
    files,
    summary: {
      fileCount: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0)
    }
  };
}

export async function cleanupOrphanImages(options: {
  files: OrphanImageFile[];
  uploadRoot?: string;
}) {
  const uploadRoot = options.uploadRoot ?? getUploadRoot();
  const results: Array<OrphanImageFile & { message?: string; status: "deleted" | "failed" | "skipped" }> = [];

  for (const file of options.files) {
    if (!isPathSafe(file.filename) || !Number.isInteger(file.itemId) || file.itemId <= 0) {
      results.push(toCleanupResult(file, "skipped", "文件路径不安全，已跳过。"));
      continue;
    }

    const absolutePath = path.join(uploadRoot, "items", String(file.itemId), file.filename);
    const fileStat = await safeLstat(absolutePath);
    if (!fileStat || fileStat.isSymbolicLink() || !fileStat.isFile()) {
      results.push(toCleanupResult(file, "skipped", "文件不存在或不是普通文件，已跳过。"));
      continue;
    }

    try {
      await rm(absolutePath, { force: true });
      results.push(toCleanupResult(file, "deleted"));
    } catch {
      results.push(toCleanupResult(file, "failed", "删除失败，请稍后重试。"));
    }
  }

  return { results };
}

function toCleanupResult(
  file: OrphanImageFile,
  status: "deleted" | "failed" | "skipped",
  message?: string
) {
  return {
    filename: file.filename,
    itemId: file.itemId,
    message,
    relativePath: file.relativePath,
    sizeBytes: file.sizeBytes,
    status
  };
}

async function safeReadDir(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function safeLstat(filePath: string) {
  try {
    return await lstat(filePath);
  } catch {
    return null;
  }
}
