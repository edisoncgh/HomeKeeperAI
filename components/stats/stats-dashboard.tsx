import Link from "next/link";
import { BarChart3, PackagePlus } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import type { StatsDistribution, StatsOverview } from "@/lib/api/stats";
import { cn } from "@/lib/class-names";

interface StatsDashboardProps {
  distribution: StatsDistribution;
  overview: StatsOverview;
}

export function StatsDashboard({ distribution, overview }: StatsDashboardProps) {
  const hasItems = overview.totals.items > 0;

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-5">
      <StatsHeader pending={overview.alerts.pending} />
      {hasItems ? <StatsContent distribution={distribution} overview={overview} /> : <StatsEmptyState />}
    </section>
  );
}

function StatsHeader({ pending }: { pending: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">M4.4 基础统计</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">统计视图</h1>
      </div>
      <Tag tone={pending > 0 ? "warning" : "success"}>{pending} 条待处理</Tag>
    </div>
  );
}

function StatsContent({ distribution, overview }: StatsDashboardProps) {
  return (
    <>
      <OverviewGrid overview={overview} />
      <StatusGrid overview={overview} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionPanel
          rows={[...distribution.categories, createUnassignedRow("未分类", distribution.uncategorized)]}
          title="分类分布"
        />
        <DistributionPanel
          rows={[...distribution.locations, createUnassignedRow("未设置位置", distribution.unlocated)]}
          title="位置分布"
        />
      </div>
    </>
  );
}

function OverviewGrid({ overview }: { overview: StatsOverview }) {
  const items = [
    { label: "物品", value: overview.totals.items },
    { label: "总数量", value: overview.totals.quantity },
    { label: "分类", value: overview.totals.categories },
    { label: "位置", value: overview.totals.locations },
    { label: "待处理预警", value: overview.alerts.pending }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card className="p-3" key={item.label}>
          <p className="text-sm text-text-tertiary">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

function StatusGrid({ overview }: { overview: StatsOverview }) {
  const stats = [
    { label: "正常", tone: "success" as const, value: overview.status.normal },
    { label: "临期", tone: "warning" as const, value: overview.status.expiring },
    { label: "已过期", tone: "danger" as const, value: overview.status.expired },
    { label: "库存不足", tone: "neutral" as const, value: overview.status.lowStock }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div className="flex min-h-11 items-center justify-between rounded-card border border-soft-border bg-surface px-3" key={stat.label}>
          <span className="text-sm text-text-secondary">{stat.label}</span>
          <Tag tone={stat.tone}>{stat.value}</Tag>
        </div>
      ))}
    </div>
  );
}

function DistributionPanel({ rows, title }: { rows: DistributionRowView[]; title: string }) {
  const visibleRows = rows.filter((row) => row.itemCount > 0);
  const maxCount = Math.max(...visibleRows.map((row) => row.itemCount), 1);

  return (
    <section className="rounded-card border border-soft-border bg-surface p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {visibleRows.map((row) => (
          <DistributionRow key={row.id} maxCount={maxCount} row={row} />
        ))}
      </div>
    </section>
  );
}

function DistributionRow({ maxCount, row }: { maxCount: number; row: DistributionRowView }) {
  return (
    <div className="grid gap-2">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm text-text-primary">
          {row.color ? <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} /> : null}
          <span className="truncate">{row.icon ? `${row.icon} ` : ""}{row.name}</span>
        </span>
        <span className="shrink-0 text-xs text-text-tertiary">{row.itemCount} 类 / {row.quantity} 件</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-primary-light">
        <div className={cn("h-full rounded-full bg-primary")} style={{ width: `${Math.max(8, (row.itemCount / maxCount) * 100)}%` }} />
      </div>
    </div>
  );
}

function StatsEmptyState() {
  return (
    <Card className="flex min-h-72 flex-col items-start justify-center gap-4">
      <BarChart3 aria-hidden className="text-primary" size={28} />
      <div>
        <h2 className="text-lg font-semibold text-text-primary">还没有可统计的物品</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          添加物品后，这里会显示库存规模、分类分布、位置分布和预警数量。
        </p>
      </div>
      <Link
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card bg-primary px-4 text-sm font-medium text-white transition hover:bg-[#43AA7F]"
        href="/items"
      >
        <PackagePlus aria-hidden size={16} />
        添加物品
      </Link>
    </Card>
  );
}

function createUnassignedRow(name: string, row: { itemCount: number; quantity: number }): DistributionRowView {
  return { color: null, icon: null, id: name, itemCount: row.itemCount, name, quantity: row.quantity };
}

type DistributionRowView = {
  color: null | string;
  icon: null | string;
  id: number | string;
  itemCount: number;
  name: string;
  quantity: number;
};
