"use client";

import { useState } from "react";
import { KeyRound, LogIn, UserRound } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

interface AuthResponse {
  message: string;
}

export function LoginForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({
        password: formData.get("password"),
        username: formData.get("username")
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    if (response.ok) {
      window.location.assign("/");
      return;
    }

    const result = (await response.json().catch(() => null)) as AuthResponse | null;
    setError(result?.message ?? "登录失败，请稍后重试。");
    setIsSubmitting(false);
  }

  return (
    <Card className="p-5">
      <CardHeader>
        <CardTitle className="text-2xl">登录</CardTitle>
        <CardDescription>使用本地账号进入家庭仓储管理系统。</CardDescription>
      </CardHeader>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="用户名"
          leadingIcon={<UserRound aria-hidden size={16} />}
          name="username"
          placeholder="admin"
          required
        />
        <Input
          label="密码"
          leadingIcon={<KeyRound aria-hidden size={16} />}
          name="password"
          placeholder="输入密码"
          required
          type="password"
        />
        {error ? <p className="text-sm leading-6 text-danger">{error}</p> : null}
        <Button disabled={isSubmitting} leadingIcon={<LogIn aria-hidden size={16} />} size="lg" type="submit">
          {isSubmitting ? "正在登录" : "登录"}
        </Button>
      </form>
    </Card>
  );
}
