import { redirect } from "next/navigation";
import { AuthPageShell, SetupForm } from "@/components/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    redirect("/login");
  }

  return (
    <AuthPageShell
      description="所有数据留在你的家庭局域网和 NAS 中。管理员账号只用于本地访问控制。"
      title="初始化本地管理员，开始管理家庭库存。"
    >
      <SetupForm />
    </AuthPageShell>
  );
}
