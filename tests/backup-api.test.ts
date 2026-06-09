import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    $disconnect: vi.fn()
  }
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

import { createBackup, listBackups, restoreBackup } from "@/lib/api/backups";

describe("backup API helpers", () => {
  let tempDir: string | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (tempDir) {
      rmSync(tempDir, { force: true, recursive: true });
      tempDir = null;
    }
  });

  it("requires authentication", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await listBackups();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("creates and lists backups for authenticated users", async () => {
    const env = prepareEnv("before");
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });

    const created = await createBackup({ env, now: new Date("2026-06-06T12:34:56.000Z") });
    const listed = await listBackups({ env });
    const createdBody = await created.json();
    const listedBody = await listed.json();

    expect(created.status).toBe(201);
    expect(createdBody.data.backup.fileName).toBe("home-storage-20260606-123456.db");
    expect(listed.status).toBe(200);
    expect(listedBody.data.backups).toHaveLength(1);
  });

  it("requires explicit confirmation before restoring a backup", async () => {
    const env = prepareEnv("before");
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const created = await createBackup({ env, now: new Date("2026-06-06T12:34:56.000Z") });
    const body = await created.json();

    const response = await restoreBackup(body.data.backup.id, jsonRequest({ confirm: false }), { env });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: "恢复备份前请先确认。" });
  });

  it("creates a protective backup before restoring", async () => {
    const env = prepareEnv("before");
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    const created = await createBackup({ env, now: new Date("2026-06-06T12:34:56.000Z") });
    const body = await created.json();
    writeFileSync(env.databasePath, "after", "utf8");

    const response = await restoreBackup(body.data.backup.id, jsonRequest({ confirm: true }), {
      env,
      now: new Date("2026-06-06T12:35:00.000Z")
    });

    expect(response.status).toBe(200);
    expect(readFileSync(env.databasePath, "utf8")).toBe("before");
    expect(readdirSync(env.BACKUP_DIR)).toContain("home-storage-protect-20260606-123500.db");
    expect(mocks.prisma.$disconnect).toHaveBeenCalled();
  });

  function prepareEnv(content: string) {
    tempDir = mkdtempSync(join(tmpdir(), "hsa-backup-api-"));
    const dataDir = join(tempDir, "data");
    const backupDir = join(tempDir, "backups");
    const databasePath = join(dataDir, "home-storage.db");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(databasePath, content, "utf8");

    return {
      BACKUP_DIR: backupDir,
      DATABASE_URL: `file:${databasePath}`,
      databasePath
    };
  }
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/backups/restore", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
}
