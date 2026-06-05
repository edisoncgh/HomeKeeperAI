import Link from "next/link";
import { ArrowRight, Bell, Boxes, MapPin, Package, Tags } from "lucide-react";
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

const shortcuts = [
  { href: "/items", label: "管理物品", text: "查看、筛选和录入家庭库存。" },
  { href: "/categories", label: "维护分类", text: "整理食品、日用品等主分类。" },
  { href: "/locations", label: "维护位置", text: "管理冰箱、储物间等位置。" }
];

export function HomeDashboard({ overview, user }: HomeDashboardProps) {
  const displayName = user.displayName ?? user.username;
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">家庭仓储总览</p>
          <h1 className="mt-2 text-3xl font-semibold">欢迎回来，{displayName}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            查看当前库存概况，继续录入物品，或手动生成一组 AI 建议。
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewStat icon={<Package aria-hidden size={20} />} label="物品" value={overview.itemCount} />
        <OverviewStat icon={<Tags aria-hidden size={20} />} label="分类" value={overview.categoryCount} />
        <OverviewStat icon={<MapPin aria-hidden size={20} />} label="位置" value={overview.locationCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-lg font-semibold">快捷入口</h2>
            <div className="mt-4 grid gap-3">
              {shortcuts.map((shortcut) => (
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
          <AlertOverviewCard summary={overview.alertSummary} />
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Boxes aria-hidden size={20} />
              最近物品
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {overview.latestItems.length ? (
                overview.latestItems.map((item) => (
                  <p className="flex justify-between text-sm" key={item.id}>
                    <span>{item.name}</span>
                    <span className="text-text-secondary">x {item.quantity}</span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-text-secondary">还没有物品，先从录入第一件物品开始。</p>
              )}
            </div>
          </Card>
        </div>
        <DashboardAdvicePanel />
      </div>
    </section>
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
