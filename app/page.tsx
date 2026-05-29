const statusItems = [
  { label: "工程框架", value: "Next.js App Router" },
  { label: "数据层", value: "Prisma + SQLite" },
  { label: "部署目标", value: "NAS + Docker Compose" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-app-background px-4 py-6 text-text-primary sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-primary">M1.1 基础工程</p>
          <h1 className="mt-2 text-3xl font-semibold">家庭仓储管理系统</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            当前最小工程已经准备承载物品、分类、位置、预警和 AI 辅助录入能力。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {statusItems.map((item) => (
            <article
              className="rounded-card border border-soft-border bg-surface p-4 shadow-sm"
              key={item.label}
            >
              <p className="text-sm text-text-tertiary">{item.label}</p>
              <p className="mt-2 text-base font-semibold">{item.value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
