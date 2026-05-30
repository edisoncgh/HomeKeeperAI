import { describe, expect, it } from "vitest";
import { parseLoginInput, parseSetupInput } from "@/lib/auth/validation";

describe("auth input validation", () => {
  it("normalizes valid setup input", () => {
    expect(
      parseSetupInput({
        displayName: "  家庭管理员  ",
        password: "local-password",
        username: "  Admin  "
      })
    ).toEqual({
      data: {
        displayName: "家庭管理员",
        password: "local-password",
        username: "admin"
      },
      ok: true
    });
  });

  it("rejects unsafe setup and login input", () => {
    expect(parseSetupInput({ password: "short", username: "a" })).toMatchObject({
      message: "用户名需为 3-32 位字母、数字、下划线或短横线。",
      ok: false
    });
    expect(parseLoginInput({ password: "", username: "" })).toMatchObject({
      message: "请输入用户名和密码。",
      ok: false
    });
  });
});
