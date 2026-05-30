import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

const testUser = {
  id: 7,
  role: "ADMIN" as const,
  username: "admin"
};

describe("auth session token", () => {
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
});
