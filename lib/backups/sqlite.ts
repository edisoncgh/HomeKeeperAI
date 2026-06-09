import { constants } from "node:fs";
import { copyFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

type BackupKind = "backup" | "protect";

export interface BackupEnv {
  BACKUP_DIR?: string;
  DATABASE_URL?: string;
  NODE_ENV?: string;
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
  sizeBytes: number;
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

export async function createDatabaseBackup(options: BackupOptions = {}) {
  const env = options.env ?? process.env;
  const backupDir = getBackupDirectory(env);
  const databasePath = resolveDatabaseFilePath(env.DATABASE_URL);

  await assertDatabaseFile(databasePath);
  await mkdir(backupDir, { recursive: true });
  const fileName = await copyDatabaseToUniqueBackup(databasePath, backupDir, options.now ?? new Date(), options.kind ?? "backup");
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
  return createBackupSummary(id, backupDir);
}

export async function deleteDatabaseBackup(id: string, options: { env?: BackupEnv } = {}) {
  const backupDir = getBackupDirectory(options.env ?? process.env);
  const backupPath = resolveBackupPath(id, backupDir);
  await assertDatabaseFile(backupPath);
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
  return {
    createdAt: parseCreatedAt(fileName).toISOString(),
    fileName,
    id: fileName,
    sizeBytes: backupStat.size
  };
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
