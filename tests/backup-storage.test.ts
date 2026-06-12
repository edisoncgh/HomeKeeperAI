import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  createDatabaseBackup,
  deleteDatabaseBackup,
  listDatabaseBackups,
  resolveDatabaseFilePath,
  restoreDatabaseBackup
} from "@/lib/backups/sqlite";

describe("SQLite backup storage", () => {
  let tempDir: string | null = null;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { force: true, recursive: true });
      tempDir = null;
    }
  });

  it("resolves Prisma-style relative SQLite file URLs from the prisma directory", () => {
    tempDir = mkdtempSync(join(tmpdir(), "hsa-backup-path-"));

    expect(resolveDatabaseFilePath("file:../data/dev.db", tempDir)).toBe(join(tempDir, "data", "dev.db"));
  });

  it("creates, lists, restores, and deletes database backups", async () => {
    const env = createTempDatabase("before");
    const now = new Date("2026-06-06T12:34:56.000Z");

    const backup = await createDatabaseBackup({ env, now });
    writeFileSync(env.databasePath, "after", "utf8");
    const backups = await listDatabaseBackups({ env });

    expect(backup.fileName).toBe("home-storage-20260606-123456.db");
    expect(backup.includesUploads).toBe(false);
    expect(backups).toEqual([backup]);

    await restoreDatabaseBackup(backup.id, { env });
    expect(readFileSync(env.databasePath, "utf8")).toBe("before");

    await deleteDatabaseBackup(backup.id, { env });
    expect(await listDatabaseBackups({ env })).toEqual([]);
  });

  it("snapshots, restores, and deletes upload files with database backups", async () => {
    const env = createTempDatabase("before");
    const now = new Date("2026-06-06T12:34:56.000Z");
    const imagePath = join(env.UPLOAD_DIR, "items", "1", "milk.jpg");
    const thumbnailPath = join(env.UPLOAD_DIR, "items", "1", "milk-thumb.jpg");
    mkdirSync(join(env.UPLOAD_DIR, "items", "1"), { recursive: true });
    writeFileSync(imagePath, "image-before", "utf8");
    writeFileSync(thumbnailPath, "thumb-before", "utf8");

    const backup = await createDatabaseBackup({ env, now });
    const uploadSnapshotDir = join(env.BACKUP_DIR, `${backup.fileName}.uploads`);
    writeFileSync(env.databasePath, "after", "utf8");
    writeFileSync(imagePath, "image-after", "utf8");
    rmSync(thumbnailPath, { force: true });
    mkdirSync(join(env.UPLOAD_DIR, "items", "2"), { recursive: true });
    writeFileSync(join(env.UPLOAD_DIR, "items", "2", "extra.jpg"), "extra", "utf8");

    expect(backup).toMatchObject({
      includesUploads: true,
      uploadFileCount: 2,
      uploadSizeBytes: "image-before".length + "thumb-before".length
    });
    expect(readFileSync(join(uploadSnapshotDir, "items", "1", "milk.jpg"), "utf8")).toBe("image-before");

    await restoreDatabaseBackup(backup.id, { env });

    expect(readFileSync(env.databasePath, "utf8")).toBe("before");
    expect(readFileSync(imagePath, "utf8")).toBe("image-before");
    expect(readFileSync(thumbnailPath, "utf8")).toBe("thumb-before");
    expect(existsSync(join(env.UPLOAD_DIR, "items", "2", "extra.jpg"))).toBe(false);

    await deleteDatabaseBackup(backup.id, { env });

    expect(existsSync(join(env.BACKUP_DIR, backup.fileName))).toBe(false);
    expect(existsSync(uploadSnapshotDir)).toBe(false);
  });

  it("does not overwrite an existing backup created in the same second", async () => {
    const env = createTempDatabase("first");
    const now = new Date("2026-06-06T12:34:56.000Z");

    const first = await createDatabaseBackup({ env, now });
    writeFileSync(env.databasePath, "second", "utf8");
    const second = await createDatabaseBackup({ env, now });
    const backups = await listDatabaseBackups({ env });

    expect(first.id).not.toBe(second.id);
    expect(backups.map((backup) => backup.id).sort()).toEqual([first.id, second.id].sort());

    await restoreDatabaseBackup(first.id, { env });
    expect(readFileSync(env.databasePath, "utf8")).toBe("first");

    await restoreDatabaseBackup(second.id, { env });
    expect(readFileSync(env.databasePath, "utf8")).toBe("second");
  });

  it("rejects unsafe backup identifiers", async () => {
    const env = createTempDatabase("data");

    await expect(restoreDatabaseBackup("../dev.db", { env })).rejects.toThrow("备份文件不存在或名称不合法。");
    await expect(deleteDatabaseBackup("C:/tmp/home-storage-20260606-123456.db", { env })).rejects.toThrow(
      "备份文件不存在或名称不合法。"
    );
  });

  function createTempDatabase(content: string) {
    tempDir = mkdtempSync(join(tmpdir(), "hsa-backup-"));
    const dataDir = join(tempDir, "data");
    const backupDir = join(tempDir, "backups");
    const uploadDir = join(tempDir, "uploads");
    const databasePath = join(dataDir, "home-storage.db");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(databasePath, content, "utf8");

    return {
      BACKUP_DIR: backupDir,
      DATABASE_URL: `file:${databasePath}`,
      UPLOAD_DIR: uploadDir,
      databasePath
    };
  }
});
