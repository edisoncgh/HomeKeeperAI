import Link from "next/link";
import { ArrowRight, Bell, Boxes, MapPin, Package, Tags } from "lucide-react";
import { CameraShortcutButton } from "@/components/ai";
import { DashboardAdvicePanel } from "@/components/ai/dashboard-advice-panel";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, Tag } from "@/components/ui";
import { HomeOverview } from "@/lib/dashboard/overview";

interface HomeDashboardProps {
  overview: HomeOverview;
  user: {
    displayName?: string | null;
    role: string;
    username: string;
  };
}

const managementLinks = [
  { href: "/items", label: "管理物品", text: "搜索、筛选和编辑库存。" },
  { href: "/stats", label: "查看完整统计", text: "查看分类、位置和状态分布。" },
  { href: "/settings", label: "系统维护", text: "备份、AI 设置、分类和位置。" }
];

export function HomeDashboard({ overview, user }: HomeDashboardProps) {
  const displayName = user.displayName ?? user.username;
  const hasPendingAlerts = overview.alertSummary.pending > 0;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">家庭仓储总览</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">欢迎回来，{displayName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
            {hasPendingAlerts ? "今天先处理预警，再补录新物品。" : "库存状态平稳，可以继续补录或整理物品。"}
          </p>
        </div>
        <LogoutButton />
      </div>

      <PriorityActionCard overview={overview} />
      <CompactStats overview={overview} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col gap-4">
          <AlertOverviewCard summary={overview.alertSummary} />
          <RecentItemsCard items={overview.latestItems.slice(0, 3)} />
          <ManagementLinks />
        </div>
        <DashboardAdvicePanel />
      </div>
    </section>
  );
}

function PriorityActionCard({ overview }: { overview: HomeOverview }) {
  const alertCopy =
    overview.alertSummary.pending > 0
      ? `${overview.alertSummary.pending} 条待处理预警`
      : "暂无待处理预警";

  return (
    <Card className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div>
        <p className="text-sm font-medium text-text-tertiary">今天先处理</p>
        <p className="mt-1 text-xl font-semibold text-text-primary">{alertCopy}</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          拍照录入新物品，或先查看临期、过期和低库存提醒。
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:min-w-40">
        <CameraShortcutButton
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#43AA7F]"
          iconSize={17}
          label="拍照入库"
        />
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card border border-primary bg-surface px-4 text-sm font-medium text-primary transition hover:bg-primary-light"
          href="/alerts"
        >
          查看预警
          <ArrowRight aria-hidden size={16} />
        </Link>
      </div>
    </Card>
  );
}

function CompactStats({ overview }: { overview: HomeOverview }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <OverviewStat icon={<Package aria-hidden size={20} />} label="物品" value={overview.itemCount} />
      <OverviewStat icon={<Tags aria-hidden size={20} />} label="分类" value={overview.categoryCount} />
      <OverviewStat icon={<MapPin aria-hidden size={20} />} label="位置" value={overview.locationCount} />
    </div>
  );
}

function ManagementLinks() {
  return (
    <Card>
      <h2 className="text-lg font-semibold">快捷入口</h2>
      <div className="mt-4 grid gap-3">
        {managementLinks.map((shortcut) => (
          <Link className="rounded-card border border-soft-border p-3 transition hover:bg-primary-light" href={shortcut.href} key={shortcut.href}>
            <span className="flex items-center justify-between text-sm font-semibold">
              {shortcut.label}
              <ArrowRight aria-hidden size={16} />
            </span>
            <span className="mt-1 block text-sm leading-6 text-text-secondary">{shortcut.text}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function RecentItemsCard({ items }: { items: HomeOverview["latestItems"] }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Boxes aria-hidden size={20} />
        最近 3 件
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {items.length ? (
          items.map((item) => (
            <p className="flex justify-between text-sm" key={item.id}>
              <span>{item.name}</span>
              <span className="text-text-secondary">x {item.quantity}</span>
            </p>
          ))
        ) : (
          <p className="text-sm text-text-secondary">还没有物品，先从拍照或手动录入开始。</p>
        )}
      </div>
    </Card>
  );
}

function AlertOverviewCard({ summary }: { summary: HomeOverview["alertSummary"] }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell aria-hidden size={20} />
          预警摘要
        </h2>
        <Tag tone={summary.pending > 0 ? "warning" : "success"}>{summary.pending} 条待处理</Tag>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <AlertMiniStat label="已过期" tone="danger" value={summary.expired} />
        <AlertMiniStat label="临期" tone="warning" value={summary.expiring} />
        <AlertMiniStat label="库存不足" tone="neutral" value={summary.lowStock} />
      </div>
      <Link
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-card border border-primary bg-surface px-4 text-sm font-medium text-primary transition hover:bg-primary-light"
        href="/alerts"
      >
        查看预警
        <ArrowRight aria-hidden size={16} />
      </Link>
    </Card>
  );
}

function AlertMiniStat({
  label,
  tone,
  value
}: {
  label: string;
  tone: "danger" | "neutral" | "warning";
  value: number;
}) {
  return (
    <div className="rounded-card border border-soft-border px-3 py-2">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text-primary">
        <Tag tone={tone}>{value}</Tag>
      </p>
    </div>
  );
}

function OverviewStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-tertiary">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
