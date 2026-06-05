"use client";

import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Loader2, PackagePlus } from "lucide-react";
import { useState } from "react";
import { Button, Card, Tag } from "@/components/ui";
import { cn } from "@/lib/class-names";

export type AlertFilterValue = "all" | "expired" | "expiring" | "low-stock" | "resolved";
export type AlertStatusValue = "PENDING" | "RESOLVED";
export type AlertTypeValue = "EXPIRED" | "EXPIRING" | "LOW_STOCK";

export interface AlertDashboardData {
  alerts: AlertView[];
  pagination: { page: number; pageCount: number; pageSize: number; total: number };
  summary: AlertSummaryView;
}

export interface AlertSummaryView {
  expired: number;
  expiring: number;
  lowStock: number;
  pending: number;
  resolved: number;
}

export interface AlertView {
  createdAt: string;
  id: number;
  item: {
    category: null | TaxonomySummaryView;
    expiryDate: null | string;
    id: number;
    location: null | TaxonomySummaryView;
    name: string;
    quantity: number;
    status: string;
  };
  itemId: number;
  status: AlertStatusValue;
  type: AlertTypeValue;
}

interface TaxonomySummaryView {
  color: null | string;
  icon: null | string;
  id: number;
  name: string;
}

interface AlertDashboardProps {
  initialData: AlertDashboardData;
  initialFilter: AlertFilterValue;
}

const alertFilters: Array<{ label: string; value: AlertFilterValue }> = [
  { label: "全部", value: "all" },
  { label: "已过期", value: "expired" },
  { label: "临期", value: "expiring" },
  { label: "库存不足", value: "low-stock" },
  { label: "已处理", value: "resolved" }
];

export function AlertDashboard({ initialData, initialFilter }: AlertDashboardProps) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<null | number>(null);

  async function changeFilter(nextFilter: AlertFilterValue) {
    setFilter(nextFilter);
    setIsLoading(true);
    setError("");
    const result = await requestAlertList(nextFilter);
    updateBrowserQuery(nextFilter);
    setIsLoading(false);
    if (result.ok) {
      setData(result.data);
    } else {
      setError(result.message);
    }
  }

  async function markResolved(alert: AlertView) {
    setResolvingId(alert.id);
    setError("");
    const result = await requestResolveAlert(alert.id);
    setResolvingId(null);
    if (result.ok) {
      setData(resolveAlertInView(data, alert.id, filter));
    } else {
      setError(result.message);
    }
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-5">
      <AlertHeader pending={data.summary.pending} />
      <AlertSummary summary={data.summary} />
      <AlertFilterBar activeFilter={filter} isLoading={isLoading} onChange={changeFilter} />
      {error ? <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <AlertList alerts={data.alerts} resolvingId={resolvingId} onResolve={markResolved} />
    </section>
  );
}

function AlertHeader({ pending }: { pending: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">M4.3 应用内预警</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">预警中心</h1>
      </div>
      <Tag tone={pending > 0 ? "warning" : "success"}>{pending} 条待处理</Tag>
    </div>
  );
}

function AlertSummary({ summary }: { summary: AlertSummaryView }) {
  const stats = [
    { label: "待处理", tone: "warning" as const, value: summary.pending },
    { label: "已过期", tone: "danger" as const, value: summary.expired },
    { label: "临期", tone: "warning" as const, value: summary.expiring },
    { label: "库存不足", tone: "neutral" as const, value: summary.lowStock },
    { label: "已处理", tone: "success" as const, value: summary.resolved }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card className="p-3" key={stat.label}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-text-tertiary">{stat.label}</p>
            <Tag tone={stat.tone}>{stat.value}</Tag>
          </div>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}

function AlertFilterBar({
  activeFilter,
  isLoading,
  onChange
}: {
  activeFilter: AlertFilterValue;
  isLoading: boolean;
  onChange: (filter: AlertFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {alertFilters.map((item) => (
        <button
          className={getFilterClassName(activeFilter === item.value)}
          disabled={isLoading}
          key={item.value}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {isLoading && activeFilter === item.value ? <Loader2 aria-hidden className="animate-spin" size={15} /> : null}
          {item.label}
        </button>
      ))}
    </div>
  );
}

function AlertList({
  alerts,
  onResolve,
  resolvingId
}: {
  alerts: AlertView[];
  onResolve: (alert: AlertView) => void;
  resolvingId: null | number;
}) {
  if (!alerts.length) {
    return <AlertEmptyState />;
  }

  return (
    <div className="min-w-0">
      <MobileAlertCards alerts={alerts} onResolve={onResolve} resolvingId={resolvingId} />
      <DesktopAlertTable alerts={alerts} onResolve={onResolve} resolvingId={resolvingId} />
    </div>
  );
}

function AlertEmptyState() {
  return (
    <Card className="flex min-h-72 flex-col items-start justify-center gap-4">
      <Bell aria-hidden className="text-primary" size={28} />
      <div>
        <h2 className="text-lg font-semibold text-text-primary">当前没有需要处理的预警</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          可以回到物品工作区补充数量、保质期、分类和位置，系统会在下次读取预警时重新同步。
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link className={getLinkButtonClassName("primary")} href="/items">
          查看物品
        </Link>
        <Link className={getLinkButtonClassName("secondary")} href="/items">
          <PackagePlus aria-hidden size={16} />
          添加物品
        </Link>
      </div>
    </Card>
  );
}

function MobileAlertCards({
  alerts,
  onResolve,
  resolvingId
}: {
  alerts: AlertView[];
  onResolve: (alert: AlertView) => void;
  resolvingId: null | number;
}) {
  return (
    <div className="grid gap-3 md:hidden">
      {alerts.map((alert) => (
        <article className={getAlertCardClassName(alert.type)} key={alert.id}>
          <AlertPrimary alert={alert} />
          <AlertMeta alert={alert} />
          <AlertResolveButton alert={alert} isLoading={resolvingId === alert.id} onResolve={onResolve} />
        </article>
      ))}
    </div>
  );
}

function DesktopAlertTable({
  alerts,
  onResolve,
  resolvingId
}: {
  alerts: AlertView[];
  onResolve: (alert: AlertView) => void;
  resolvingId: null | number;
}) {
  return (
    <div className="hidden overflow-hidden rounded-card border border-soft-border bg-surface md:block">
      <div className="grid grid-cols-[minmax(180px,1.2fr)_108px_120px_120px_140px_128px] border-b border-soft-border px-4 py-3 text-xs font-medium text-text-tertiary">
        <span>物品</span>
        <span>预警</span>
        <span>分类</span>
        <span>位置</span>
        <span>时间</span>
        <span>操作</span>
      </div>
      <div className="divide-y divide-soft-border">
        {alerts.map((alert) => (
          <div className="grid grid-cols-[minmax(180px,1.2fr)_108px_120px_120px_140px_128px] items-center gap-2 px-4 py-3" key={alert.id}>
            <AlertPrimary alert={alert} />
            <AlertTypeTag type={alert.type} />
            <TaxonomyPill item={alert.item.category} fallback="未分类" />
            <TaxonomyPill item={alert.item.location} fallback="未设置" />
            <span className="text-sm text-text-secondary">{getAlertTimingText(alert)}</span>
            <AlertResolveButton alert={alert} isLoading={resolvingId === alert.id} onResolve={onResolve} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertPrimary({ alert }: { alert: AlertView }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <AlertTriangle aria-hidden className={getAlertIconClassName(alert.type)} size={16} />
        <h2 className="truncate text-base font-semibold text-text-primary md:text-sm">{alert.item.name}</h2>
      </div>
      <p className="mt-1 text-xs text-text-tertiary">{alert.item.quantity} 件</p>
    </div>
  );
}

function AlertMeta({ alert }: { alert: AlertView }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <AlertTypeTag type={alert.type} />
      <TaxonomyPill item={alert.item.category} fallback="未分类" />
      <TaxonomyPill item={alert.item.location} fallback="未设置" />
      <Tag>{getExpiryText(alert.item.expiryDate)}</Tag>
      <Tag>{getAlertTimingText(alert)}</Tag>
    </div>
  );
}

function AlertResolveButton({
  alert,
  isLoading,
  onResolve
}: {
  alert: AlertView;
  isLoading: boolean;
  onResolve: (alert: AlertView) => void;
}) {
  if (alert.status === "RESOLVED") {
    return <Tag tone="success">已处理</Tag>;
  }

  return (
    <Button
      className="mt-3 w-full md:mt-0 md:w-auto"
      disabled={isLoading}
      leadingIcon={isLoading ? <Loader2 aria-hidden className="animate-spin" size={16} /> : <CheckCircle2 aria-hidden size={16} />}
      onClick={() => onResolve(alert)}
      variant="secondary"
    >
      {isLoading ? "处理中" : "标记已处理"}
    </Button>
  );
}

function AlertTypeTag({ type }: { type: AlertTypeValue }) {
  const meta = getAlertTypeMeta(type);
  return <Tag tone={meta.tone}>{meta.label}</Tag>;
}

function TaxonomyPill({ fallback, item }: { fallback: string; item: null | TaxonomySummaryView }) {
  return (
    <Tag>
      {item?.color ? <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} /> : null}
      {item?.name ?? fallback}
    </Tag>
  );
}

async function requestAlertList(filter: AlertFilterValue) {
  const params = buildAlertSearchParams(filter);
  const path = params.size ? `/api/alerts?${params.toString()}` : "/api/alerts";
  const response = await fetch(path, { headers: { "Content-Type": "application/json" } });
  const payload = (await response.json().catch(() => null)) as AlertListApiResponse;

  if (!response.ok || !payload || payload.code !== 0 || !payload.data) {
    return { message: payload?.message ?? "预警列表加载失败，请稍后重试。", ok: false as const };
  }

  return { data: payload.data, ok: true as const };
}

async function requestResolveAlert(id: number) {
  const response = await fetch(`/api/alerts/${id}/resolve`, { method: "PUT" });
  const payload = (await response.json().catch(() => null)) as AlertItemApiResponse;

  if (!response.ok || !payload || payload.code !== 0 || !payload.data?.alert) {
    return { message: payload?.message ?? "预警处理失败，请稍后重试。", ok: false as const };
  }

  return { alert: payload.data.alert, ok: true as const };
}

function resolveAlertInView(data: AlertDashboardData, alertId: number, filter: AlertFilterValue): AlertDashboardData {
  const resolvedAlert = data.alerts.find((alert) => alert.id === alertId);
  const alerts = data.alerts.map((alert) => (alert.id === alertId ? { ...alert, status: "RESOLVED" as const } : alert));

  return {
    ...data,
    alerts: filter === "resolved" ? alerts : alerts.filter((alert) => alert.id !== alertId),
    summary: resolvedAlert?.status === "PENDING" ? incrementResolvedSummary(data.summary) : data.summary
  };
}

function incrementResolvedSummary(summary: AlertSummaryView): AlertSummaryView {
  return { ...summary, pending: Math.max(0, summary.pending - 1), resolved: summary.resolved + 1 };
}

function buildAlertSearchParams(filter: AlertFilterValue) {
  const params = new URLSearchParams();
  if (filter === "resolved") {
    params.set("status", "RESOLVED");
  } else {
    params.set("status", "PENDING");
  }

  const type = getAlertFilterType(filter);
  if (type) {
    params.set("type", type);
  }

  return params;
}

function getAlertFilterType(filter: AlertFilterValue): null | AlertTypeValue {
  const types: Partial<Record<AlertFilterValue, AlertTypeValue>> = {
    expired: "EXPIRED",
    expiring: "EXPIRING",
    "low-stock": "LOW_STOCK"
  };

  return types[filter] ?? null;
}

function getAlertTypeMeta(type: AlertTypeValue) {
  const meta: Record<AlertTypeValue, { label: string; tone: "danger" | "neutral" | "warning" }> = {
    EXPIRED: { label: "已过期", tone: "danger" },
    EXPIRING: { label: "临期", tone: "warning" },
    LOW_STOCK: { label: "库存不足", tone: "neutral" }
  };

  return meta[type];
}

function getAlertTimingText(alert: AlertView) {
  if (alert.type === "LOW_STOCK") {
    return `库存 ${alert.item.quantity} 件`;
  }

  const days = getDaysUntilExpiry(alert.item.expiryDate);
  if (days === null) {
    return "未记录保质期";
  }

  return days < 0 ? `已过期 ${Math.abs(days)} 天` : days === 0 ? "今天到期" : `还剩 ${days} 天`;
}

function getExpiryText(value: null | string) {
  return value ? `保质期 ${value.slice(0, 10)}` : "未记录保质期";
}

function getDaysUntilExpiry(value: null | string) {
  if (!value) {
    return null;
  }

  const expiry = new Date(value);
  const now = new Date();
  const expiryDay = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((expiryDay - today) / 86_400_000);
}

function getFilterClassName(isActive: boolean) {
  return cn(
    "inline-flex min-h-11 items-center gap-2 rounded-card border px-3 text-sm font-medium transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isActive ? "border-primary bg-primary text-white" : "border-soft-border bg-surface text-text-secondary hover:bg-primary-light"
  );
}

function getAlertCardClassName(type: AlertTypeValue) {
  return cn("rounded-card border bg-surface p-4 shadow-sm", type === "EXPIRED" ? "border-danger/30" : "border-soft-border");
}

function getAlertIconClassName(type: AlertTypeValue) {
  return type === "EXPIRED" ? "text-danger" : type === "EXPIRING" ? "text-warning" : "text-text-secondary";
}

function getLinkButtonClassName(variant: "primary" | "secondary") {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-4 text-sm font-medium transition",
    variant === "primary" ? "bg-primary text-white hover:bg-[#43AA7F]" : "border border-primary bg-surface text-primary hover:bg-primary-light"
  );
}

function updateBrowserQuery(filter: AlertFilterValue) {
  if (typeof window === "undefined") {
    return;
  }

  const params = buildAlertSearchParams(filter);
  const query = params.toString();
  window.history.replaceState(null, "", query ? `/alerts?${query}` : "/alerts");
}

interface AlertListApiResponse {
  code: number;
  data?: AlertDashboardData;
  message: string;
}

interface AlertItemApiResponse {
  code: number;
  data?: { alert: AlertView };
  message: string;
}
