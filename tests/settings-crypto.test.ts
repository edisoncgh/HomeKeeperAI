import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/settings/secret";

describe("settings secret encryption", () => {
  it("encrypts values without storing plaintext and decrypts them with the same secret", () => {
    const encrypted = encryptSecret("sk-test-secret", "auth-secret");

    expect(encrypted).not.toContain("sk-test-secret");
    expect(decryptSecret(encrypted, "auth-secret")).toBe("sk-test-secret");
  });

  it("returns null for empty or invalid encrypted values", () => {
    expect(decryptSecret(null, "auth-secret")).toBeNull();
    expect(decryptSecret("bad-value", "auth-secret")).toBeNull();
  });
});
