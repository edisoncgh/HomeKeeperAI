import { apiError, apiOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  BackupError,
  type BackupEnv,
  createDatabaseBackup,
  deleteDatabaseBackup,
  listDatabaseBackups,
  restoreDatabaseBackup
} from "@/lib/backups/sqlite";

interface BackupApiOptions {
  env?: BackupEnv;
  now?: Date;
}

export async function listBackups(options: BackupApiOptions = {}) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  return handleBackupOperation(async () => apiOk({ backups: await listDatabaseBackups({ env: options.env }) }));
}

export async function createBackup(options: BackupApiOptions = {}) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  return handleBackupOperation(async () => {
    const backup = await createDatabaseBackup({ env: options.env, now: options.now });
    return apiOk({ backup }, 201);
  });
}

export async function restoreBackup(id: string, request: Request, options: BackupApiOptions = {}) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  const input = await readRequestJson(request);
  if (!isConfirmedRestore(input)) {
    return apiError("恢复备份前请先确认。", 400);
  }

  return handleBackupOperation(async () => {
    const protectionBackup = await createDatabaseBackup({ env: options.env, kind: "protect", now: options.now });
    await prisma.$disconnect();
    const restoredBackup = await restoreDatabaseBackup(id, { env: options.env });
    return apiOk({ protectionBackup, restoredBackup });
  });
}

export async function removeBackup(id: string, options: BackupApiOptions = {}) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  return handleBackupOperation(async () => {
    await deleteDatabaseBackup(id, { env: options.env });
    return apiOk({ deleted: true, id });
  });
}

async function getUnauthorizedResponse() {
  const user = await getCurrentUser();
  return user ? null : apiError("请先登录。", 401);
}

async function handleBackupOperation(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof BackupError) {
      return apiError(error.message, error.status);
    }

    return apiError("备份操作失败，请稍后重试。", 500);
  }
}

async function readRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isConfirmedRestore(input: unknown) {
  return Boolean(input && typeof input === "object" && "confirm" in input && input.confirm === true);
}
