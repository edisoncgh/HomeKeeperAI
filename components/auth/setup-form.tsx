"use client";

import { useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

interface AuthResponse {
  message: string;
}

export function SetupForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/setup", {
      body: JSON.stringify({
        displayName: formData.get("displayName"),
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
    setError(result?.message ?? "初始化失败，请稍后重试。");
    setIsSubmitting(false);
  }

  return (
    <Card className="p-5">
      <CardHeader>
        <CardTitle className="text-2xl">创建管理员</CardTitle>
        <CardDescription>首次部署时创建本地管理员账号。</CardDescription>
      </CardHeader>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="用户名"
          leadingIcon={<UserRound aria-hidden size={16} />}
          name="username"
          placeholder="admin"
          required
        />
        <Input label="显示名" name="displayName" placeholder="家庭管理员" />
        <Input
          label="密码"
          leadingIcon={<KeyRound aria-hidden size={16} />}
          minLength={8}
          name="password"
          placeholder="至少 8 位"
          required
          type="password"
        />
        {error ? <p className="text-sm leading-6 text-danger">{error}</p> : null}
        <Button disabled={isSubmitting} size="lg" type="submit">
          {isSubmitting ? "正在创建" : "创建并进入"}
        </Button>
      </form>
    </Card>
  );
}
