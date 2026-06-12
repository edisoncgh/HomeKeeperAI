import { constants } from "node:fs";
import { copyFile, cp, mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

type BackupKind = "backup" | "protect";

export interface BackupEnv {
  BACKUP_DIR?: string;
  DATABASE_URL?: string;
  NODE_ENV?: string;
  UPLOAD_DIR?: string;
}

interface BackupOptions {
  env?: BackupEnv;
  kind?: BackupKind;
  now?: Date;
}

export interface BackupSummary {
  createdAt: string;
  fileName: string;
  id: string;
  includesUploads: boolean;
  sizeBytes: number;
  uploadFileCount: number;
  uploadSizeBytes: number;
}

interface UploadManifest {
  createdAt: string;
  fileCount: number;
  rootName: "uploads";
  totalSizeBytes: number;
}

export class BackupError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

const BACKUP_FILE_PATTERN = /^home-storage-(?:protect-)?\d{8}-\d{6}(?:-\d{3})?\.db$/;
const UPLOAD_MANIFEST_FILE = "manifest.json";

export function resolveDatabaseFilePath(databaseUrl = process.env.DATABASE_URL, cwd = process.cwd()) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new BackupError("当前数据库不是 SQLite 文件，无法执行备份。", 500);
  }

  const rawPath = decodeURIComponent(databaseUrl.slice(5).split("?")[0] ?? "");
  if (!rawPath) {
    throw new BackupError("数据库文件路径为空，无法执行备份。", 500);
  }

  return isAbsolutePath(rawPath) ? rawPath : resolve(cwd, "prisma", rawPath);
}

export function getBackupDirectory(env: BackupEnv = process.env, cwd = process.cwd()) {
  const configured = env.BACKUP_DIR?.trim();
  if (configured) {
    return resolve(cwd, configured);
  }

  return env.NODE_ENV === "production" ? "/app/backups" : join(cwd, "backups");
}

export function getUploadDirectory(env: BackupEnv = process.env, cwd = process.cwd()) {
  const configured = env.UPLOAD_DIR?.trim();
  if (configured) {
    return resolve(cwd, configured);
  }

  return env.NODE_ENV === "production" ? "/app/uploads" : join(cwd, "uploads");
}

export async function createDatabaseBackup(options: BackupOptions = {}) {
  const env = options.env ?? process.env;
  const backupDir = getBackupDirectory(env);
  const databasePath = resolveDatabaseFilePath(env.DATABASE_URL);
  const now = options.now ?? new Date();

  await assertDatabaseFile(databasePath);
  await mkdir(backupDir, { recursive: true });
  const fileName = await copyDatabaseToUniqueBackup(databasePath, backupDir, now, options.kind ?? "backup");
  const snapshotPath = createUploadSnapshotPath(fileName, backupDir);
  try {
    await snapshotUploadsIfPresent(getUploadDirectory(env), snapshotPath, now);
  } catch (error) {
    await Promise.all([
      unlink(resolveBackupPath(fileName, backupDir)).catch((cleanupError) =>
        console.warn("清理数据库备份文件失败:", cleanupError instanceof Error ? cleanupError.message : cleanupError)
      ),
      rm(snapshotPath, { force: true, recursive: true }).catch((cleanupError) =>
        console.warn("清理上传快照失败:", cleanupError instanceof Error ? cleanupError.message : cleanupError)
      )
    ]);
    throw error;
  }
  return createBackupSummary(fileName, backupDir);
}

export async function listDatabaseBackups(options: { env?: BackupEnv } = {}) {
  const backupDir = getBackupDirectory(options.env ?? process.env);
  await mkdir(backupDir, { recursive: true });
  const fileNames = (await readdir(backupDir)).filter(isBackupFileName);
  const summaries = await Promise.all(fileNames.map((fileName) => createBackupSummary(fileName, backupDir)));

  return summaries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function restoreDatabaseBackup(id: string, options: { env?: BackupEnv } = {}) {
  const env = options.env ?? process.env;
  const backupDir = getBackupDirectory(env);
  const databasePath = resolveDatabaseFilePath(env.DATABASE_URL);
  const sourcePath = resolveBackupPath(id, backupDir);

  await assertDatabaseFile(sourcePath);
  await mkdir(dirname(databasePath), { recursive: true });
  await copyFile(sourcePath, databasePath);
  await restoreUploadSnapshotIfPresent(createUploadSnapshotPath(id, backupDir), getUploadDirectory(env));
  return createBackupSummary(id, backupDir);
}

export async function deleteDatabaseBackup(id: string, options: { env?: BackupEnv } = {}) {
  const backupDir = getBackupDirectory(options.env ?? process.env);
  const backupPath = resolveBackupPath(id, backupDir);
  await assertDatabaseFile(backupPath);
  await rm(createUploadSnapshotPath(id, backupDir), { force: true, recursive: true });
  await unlink(backupPath);
}

function resolveBackupPath(id: string, backupDir: string) {
  const fileName = decodeBackupId(id);
  if (!isBackupFileName(fileName)) {
    throw new BackupError("备份文件不存在或名称不合法。", 404);
  }

  return resolve(backupDir, fileName);
}

async function copyDatabaseToUniqueBackup(databasePath: string, backupDir: string, now: Date, kind: BackupKind) {
  for (let sequence = 0; sequence < 1000; sequence += 1) {
    const fileName = createBackupFileName(now, kind, sequence);
    const targetPath = resolveBackupPath(fileName, backupDir);
    try {
      await copyFile(databasePath, targetPath, constants.COPYFILE_EXCL);
      return fileName;
    } catch (error) {
      if (isFileExistsError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new BackupError("同一秒内备份数量过多，请稍后重试。", 500);
}

function createBackupFileName(now: Date, kind: BackupKind, sequence = 0) {
  const prefix = kind === "protect" ? "home-storage-protect" : "home-storage";
  const suffix = sequence === 0 ? "" : `-${String(sequence).padStart(3, "0")}`;
  return `${prefix}-${formatTimestamp(now)}${suffix}.db`;
}

function formatTimestamp(date: Date) {
  const parts = [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds())
  ];

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
}

async function createBackupSummary(fileName: string, backupDir: string): Promise<BackupSummary> {
  const backupStat = await stat(resolveBackupPath(fileName, backupDir));
  const uploadManifest = await readUploadManifest(createUploadSnapshotPath(fileName, backupDir));
  return {
    createdAt: parseCreatedAt(fileName).toISOString(),
    fileName,
    id: fileName,
    includesUploads: uploadManifest !== null,
    sizeBytes: backupStat.size,
    uploadFileCount: uploadManifest?.fileCount ?? 0,
    uploadSizeBytes: uploadManifest?.totalSizeBytes ?? 0
  };
}

async function snapshotUploadsIfPresent(uploadDir: string, snapshotDir: string, now: Date) {
  if (!(await isDirectory(uploadDir))) {
    return;
  }

  await rm(snapshotDir, { force: true, recursive: true });
  await mkdir(snapshotDir, { recursive: true });
  await cp(uploadDir, snapshotDir, { recursive: true });
  const manifest = await createUploadManifest(snapshotDir, now);
  await writeFile(join(snapshotDir, UPLOAD_MANIFEST_FILE), JSON.stringify(manifest, null, 2), "utf8");
}

async function restoreUploadSnapshotIfPresent(snapshotDir: string, uploadDir: string) {
  if (!(await isDirectory(snapshotDir))) {
    return;
  }

  await mkdir(dirname(uploadDir), { recursive: true });
  const tempDir = `${uploadDir}.restore-${Date.now()}`;
  const previousDir = `${uploadDir}.previous-${Date.now()}`;

  await rm(tempDir, { force: true, recursive: true });
  await rm(previousDir, { force: true, recursive: true });
  await cp(snapshotDir, tempDir, {
    filter: (source) => source !== join(snapshotDir, UPLOAD_MANIFEST_FILE),
    recursive: true
  });

  const hadUploadDir = await pathExists(uploadDir);
  if (hadUploadDir) {
    await rename(uploadDir, previousDir);
  }

  try {
    await rename(tempDir, uploadDir);
    await rm(previousDir, { force: true, recursive: true });
  } catch (error) {
    if (hadUploadDir && !(await pathExists(uploadDir))) {
      await rename(previousDir, uploadDir).catch((rollbackError) =>
        console.warn("回滚上传目录失败:", rollbackError instanceof Error ? rollbackError.message : rollbackError)
      );
    }
    throw error;
  } finally {
    await rm(tempDir, { force: true, recursive: true }).catch((cleanupError) =>
      console.warn("清理临时上传目录失败:", cleanupError instanceof Error ? cleanupError.message : cleanupError)
    );
  }
}

async function createUploadManifest(snapshotDir: string, now: Date): Promise<UploadManifest> {
  const summary = await summarizeDirectory(snapshotDir);
  return {
    createdAt: now.toISOString(),
    fileCount: summary.fileCount,
    rootName: "uploads",
    totalSizeBytes: summary.totalSizeBytes
  };
}

async function readUploadManifest(snapshotDir: string): Promise<UploadManifest | null> {
  try {
    const parsed = JSON.parse(await readFile(join(snapshotDir, UPLOAD_MANIFEST_FILE), "utf8"));
    return parseUploadManifest(parsed) ?? (await summarizeUploadSnapshot(snapshotDir));
  } catch {
    return summarizeUploadSnapshot(snapshotDir);
  }
}

async function summarizeUploadSnapshot(snapshotDir: string): Promise<UploadManifest | null> {
  if (!(await isDirectory(snapshotDir))) {
    return null;
  }

  const summary = await summarizeDirectory(snapshotDir);
  return { createdAt: new Date(0).toISOString(), fileCount: summary.fileCount, rootName: "uploads", totalSizeBytes: summary.totalSizeBytes };
}

function parseUploadManifest(value: unknown): UploadManifest | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const manifest = value as Record<string, unknown>;
  if (manifest.rootName !== "uploads" || typeof manifest.fileCount !== "number" || typeof manifest.totalSizeBytes !== "number") {
    return null;
  }
  return {
    createdAt: typeof manifest.createdAt === "string" ? manifest.createdAt : new Date(0).toISOString(),
    fileCount: manifest.fileCount,
    rootName: "uploads",
    totalSizeBytes: manifest.totalSizeBytes
  };
}

async function summarizeDirectory(dir: string) {
  let fileCount = 0;
  let totalSizeBytes = 0;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const child = await summarizeDirectory(entryPath);
      fileCount += child.fileCount;
      totalSizeBytes += child.totalSizeBytes;
    } else if (entry.isFile() && entry.name !== UPLOAD_MANIFEST_FILE) {
      fileCount += 1;
      totalSizeBytes += (await stat(entryPath)).size;
    }
  }

  return { fileCount, totalSizeBytes };
}

async function isDirectory(dir: string) {
  try {
    return (await stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function createUploadSnapshotPath(fileName: string, backupDir: string) {
  const decoded = decodeBackupId(fileName);
  if (!isBackupFileName(decoded)) {
    throw new BackupError("备份文件名不合法。", 400);
  }

  return resolve(backupDir, `${decoded}.uploads`);
}

async function assertDatabaseFile(filePath: string) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      return;
    }
  } catch {
    throw new BackupError("数据库或备份文件不存在。", 404);
  }

  throw new BackupError("数据库或备份文件不存在。", 404);
}

function decodeBackupId(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return "";
  }
}

function isBackupFileName(fileName: string) {
  return BACKUP_FILE_PATTERN.test(fileName);
}

function parseCreatedAt(fileName: string) {
  const match = fileName.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return new Date(0);
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])));
}

function isAbsolutePath(filePath: string) {
  return filePath.startsWith("/") || /^[A-Za-z]:[\\/]/.test(filePath);
}

function isFileExistsError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
