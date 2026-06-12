"use client";

import { useState } from "react";
import { DatabaseBackup, RefreshCw, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BackupSummary } from "@/lib/backups/sqlite";

type BackupNotice = { message: string; tone: "danger" | "success" };
type BackupResponse = { data?: { backup?: BackupSummary; backups?: BackupSummary[] }; message: string; ok: boolean };

interface BackupMaintenancePanelProps {
  initialBackups: BackupSummary[];
}

export function BackupMaintenancePanel({ initialBackups }: BackupMaintenancePanelProps) {
  const [backups, setBackups] = useState(initialBackups);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<BackupNotice | null>(null);

  async function runAction(action: string, request: () => Promise<BackupResponse>) {
    setBusyAction(action);
    setNotice(null);
    try {
      const response = await request();
      handleBackupResponse(response, setBackups, setNotice);
    } catch {
      handleBackupResponse({ message: "请求失败，请稍后重试。", ok: false }, setBackups, setNotice);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseBackup aria-hidden size={20} />
          数据备份
        </CardTitle>
        <CardDescription>SQLite 数据库与物品图片备份、恢复和删除。</CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-4">
        <BackupActions busyAction={busyAction} runAction={runAction} />
        {notice ? <BackupNoticeBox notice={notice} /> : null}
        <BackupList backups={backups} busyAction={busyAction} runAction={runAction} />
      </div>
    </Card>
  );
}

function BackupActions({
  busyAction,
  runAction
}: {
  busyAction: string | null;
  runAction: (action: string, request: () => Promise<BackupResponse>) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button disabled={Boolean(busyAction)} leadingIcon={<ShieldCheck aria-hidden size={18} />} onClick={() => runAction("create", createBackup)}>
        {busyAction === "create" ? "创建中" : "创建备份"}
      </Button>
      <Button disabled={Boolean(busyAction)} leadingIcon={<RefreshCw aria-hidden size={18} />} onClick={() => runAction("refresh", listBackups)} variant="secondary">
        刷新列表
      </Button>
    </div>
  );
}

function BackupList({
  backups,
  busyAction,
  runAction
}: {
  backups: BackupSummary[];
  busyAction: string | null;
  runAction: (action: string, request: () => Promise<BackupResponse>) => Promise<void>;
}) {
  if (backups.length === 0) {
    return <p className="rounded-card border border-dashed border-soft-border px-4 py-5 text-sm text-text-secondary">还没有备份</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {backups.map((backup) => (
        <BackupListItem backup={backup} busyAction={busyAction} key={backup.id} runAction={runAction} />
      ))}
    </ul>
  );
}

function BackupListItem({
  backup,
  busyAction,
  runAction
}: {
  backup: BackupSummary;
  busyAction: string | null;
  runAction: (action: string, request: () => Promise<BackupResponse>) => Promise<void>;
}) {
  const isBusy = Boolean(busyAction);
  return (
    <li className="flex flex-col gap-3 rounded-card border border-soft-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-all text-sm font-medium text-text-primary">{backup.fileName}</p>
        <p className="mt-1 text-xs text-text-tertiary">
          {formatDateTime(backup.createdAt)} · 数据库 {formatBytes(backup.sizeBytes)} · {formatUploadSummary(backup)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button disabled={isBusy} leadingIcon={<RotateCcw aria-hidden size={16} />} onClick={() => restoreBackup(backup, runAction)} size="sm" variant="secondary">
          恢复
        </Button>
        <Button disabled={isBusy} leadingIcon={<Trash2 aria-hidden size={16} />} onClick={() => removeBackup(backup, runAction)} size="sm" variant="danger">
          删除
        </Button>
      </div>
    </li>
  );
}

function BackupNoticeBox({ notice }: { notice: BackupNotice }) {
  return (
    <div
      className={[
        "rounded-card border px-3 py-2 text-sm",
        notice.tone === "success" ? "border-primary bg-primary-light text-text-primary" : "border-danger bg-[#FDEDEC] text-text-primary"
      ].join(" ")}
      role="status"
    >
      {notice.message}
    </div>
  );
}

async function createBackup() {
  return fetchBackupJson("/api/backups", { method: "POST" });
}

async function listBackups() {
  return fetchBackupJson("/api/backups");
}

function restoreBackup(backup: BackupSummary, runAction: (action: string, request: () => Promise<BackupResponse>) => Promise<void>) {
  if (!window.confirm(`确认恢复备份 ${backup.fileName}？当前数据库和图片目录会先创建保护性备份。`)) {
    return;
  }

  void runAction(`restore:${backup.id}`, () =>
    fetchBackupJson("/api/backups/restore", {
      body: JSON.stringify({ confirm: true, id: backup.id }),
      headers: { "content-type": "application/json" },
      method: "POST"
    })
  );
}

function removeBackup(backup: BackupSummary, runAction: (action: string, request: () => Promise<BackupResponse>) => Promise<void>) {
  if (!window.confirm(`确认删除备份 ${backup.fileName}？`)) {
    return;
  }

  void runAction(`delete:${backup.id}`, () => fetchBackupJson(`/api/backups/${encodeURIComponent(backup.id)}`, { method: "DELETE" }));
}

function handleBackupResponse(
  response: BackupResponse,
  setBackups: (backups: BackupSummary[]) => void,
  setNotice: (notice: BackupNotice) => void
) {
  if (!response.ok) {
    setNotice({ message: response.message, tone: "danger" });
    return;
  }

  if (response.data?.backups) {
    setBackups(response.data.backups);
  } else {
    void listBackups().then((nextResponse) => setBackups(nextResponse.data?.backups ?? []));
  }
  setNotice({ message: "备份操作已完成。", tone: "success" });
}

export async function fetchBackupJson(input: RequestInfo | URL, init?: RequestInit): Promise<BackupResponse> {
  try {
    const response = await fetch(input, init);
    const body = (await response.json().catch(() => ({ message: "请求失败，请稍后重试。" }))) as BackupResponse;
    return { data: body.data, message: body.message ?? "请求失败，请稍后重试。", ok: response.ok };
  } catch {
    return { message: "请求失败，请稍后重试。", ok: false };
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  return `${Math.round(value / 1024)} KB`;
}

function formatUploadSummary(backup: BackupSummary) {
  if (!backup.includesUploads) {
    return "无图片快照";
  }

  return `图片 ${backup.uploadFileCount} 个 / ${formatBytes(backup.uploadSizeBytes)}`;
}
