import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

const globalForAuthTest = globalThis as typeof globalThis & {
  authDevSecret?: string;
};

const testUser = {
  id: 7,
  role: "ADMIN" as const,
  username: "admin"
};

describe("auth session token", () => {
  let tempDir: string | null = null;

  afterEach(() => {
    vi.unstubAllEnvs();
    delete globalForAuthTest.authDevSecret;
    if (tempDir) {
      rmSync(tempDir, { force: true, recursive: true });
      tempDir = null;
    }
  });

  it("creates and verifies a signed session token", () => {
    const token = createSessionToken(testUser, {
      now: new Date("2026-05-30T00:00:00.000Z"),
      secret: "test-secret"
    });

    expect(verifySessionToken(token, { secret: "test-secret" })).toMatchObject({
      role: "ADMIN",
      userId: 7,
      username: "admin"
    });
  });

  it("rejects tampered or expired tokens", () => {
    const token = createSessionToken(testUser, {
      now: new Date("2026-05-30T00:00:00.000Z"),
      secret: "test-secret"
    });

    expect(verifySessionToken(`${token}tampered`, { secret: "test-secret" })).toBeNull();
    expect(
      verifySessionToken(token, {
        now: new Date("2026-06-08T00:00:00.000Z"),
        secret: "test-secret"
      })
    ).toBeNull();
  });

  it("keeps development fallback secret stable across module reloads", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_SECRET", "");

    const { createSessionToken: createToken } = await import("@/lib/auth/session");
    const token = createToken(testUser);

    vi.resetModules();
    const { verifySessionToken: verifyToken } = await import("@/lib/auth/session");

    expect(verifyToken(token)).toMatchObject({
      role: "ADMIN",
      userId: 7,
      username: "admin"
    });
  });

  it("persists the development fallback secret outside the current process", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "hsa-auth-"));
    const secretPath = join(tempDir, "dev-secret");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_DEV_SECRET_PATH", secretPath);

    const { getAuthSecret } = await import("@/lib/auth/session");
    const firstSecret = getAuthSecret();

    delete globalForAuthTest.authDevSecret;
    vi.resetModules();
    const { getAuthSecret: getReloadedAuthSecret } = await import("@/lib/auth/session");

    expect(getReloadedAuthSecret()).toBe(firstSecret);
  });
});
