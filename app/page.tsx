import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";

const statusItems = [
  { label: "工程框架", value: "Next.js App Router" },
  { label: "数据层", value: "Prisma + SQLite" },
  { label: "布局层", value: "移动底栏 / 折叠侧栏" }
];

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-primary">M1.3 响应式布局框架</p>
        <h1 className="mt-2 text-3xl font-semibold">家庭仓储管理系统</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
          当前工程已经具备全局导航外壳，可继续承载物品、分类、位置、预警和 AI 辅助录入能力。
        </p>
        <div className="mt-5">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-card bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#43AA7F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="/ui"
          >
            查看组件示例
            <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {statusItems.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-text-tertiary">{item.label}</p>
            <p className="mt-2 text-base font-semibold">{item.value}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
