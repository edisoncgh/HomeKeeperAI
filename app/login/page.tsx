import { redirect } from "next/navigation";
import { AuthPageShell, LoginForm } from "@/components/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/setup");
  }

  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <AuthPageShell
      description="使用本地账号进入应用。后续物品、位置、预警和 AI 配置都会在登录后管理。"
      title="进入你的家庭仓储工作台。"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
