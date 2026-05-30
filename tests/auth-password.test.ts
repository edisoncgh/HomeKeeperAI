import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies a password against its hash without storing the plain password", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    expect(passwordHash).not.toContain("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", passwordHash)).resolves.toBe(false);
  });
});
