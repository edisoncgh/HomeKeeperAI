"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";

export function LogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <Button
      disabled={isSubmitting}
      leadingIcon={<LogOut aria-hidden size={16} />}
      onClick={handleLogout}
      variant="secondary"
    >
      {isSubmitting ? "正在退出" : "退出登录"}
    </Button>
  );
}
