"use client";

import { useState } from "react";
import { ImageOff, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrphanImageFile, OrphanImageScanResult } from "@/lib/storage/orphan-images";

type MaintenanceNotice = { message: string; tone: "danger" | "success" };
type CleanupResult = OrphanImageFile & {
  message?: string;
  status: "deleted" | "failed" | "skipped";
};
type MaintenanceResponse = {
  data?: OrphanImageScanResult | { results: CleanupResult[] };
  message: string;
  ok: boolean;
};

const ORPHAN_IMAGES_API_PATH = "/api/maintenance/orphan-images";
const ORPHAN_IMAGES_CLEANUP_API_PATH = "/api/maintenance/orphan-images/cleanup";

export function OrphanImageMaintenancePanel() {
  const [scan, setScan] = useState<OrphanImageScanResult | null>(null);
  const [busyAction, setBusyAction] = useState<"cleanup" | "scan" | null>(null);
  const [notice, setNotice] = useState<MaintenanceNotice | null>(null);

  async function runScan() {
    setBusyAction("scan");
    setNotice(null);
    const response = await fetchOrphanImageMaintenanceJson(ORPHAN_IMAGES_API_PATH);
    if (response.ok && isScanResult(response.data)) {
      setScan(response.data);
      setNotice({ message: "扫描完成。", tone: "success" });
    } else {
      setNotice({ message: response.message, tone: "danger" });
    }
    setBusyAction(null);
  }

  async function runCleanup() {
    if (!window.confirm("确认清理当前扫描发现的孤儿图片？清理前系统会重新扫描，避免删除刚被引用的图片。")) {
      return;
    }

    setBusyAction("cleanup");
    setNotice(null);
    const response = await fetchOrphanImageMaintenanceJson(ORPHAN_IMAGES_CLEANUP_API_PATH, {
      body: JSON.stringify({ confirm: true }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (response.ok && isCleanupResult(response.data)) {
      const deletedCount = response.data.results.filter((result) => result.status === "deleted").length;
      setScan({ files: [], summary: { fileCount: 0, totalBytes: 0 } });
      setNotice({ message: `清理完成，已删除 ${deletedCount} 个文件。`, tone: "success" });
    } else {
      setNotice({ message: response.message, tone: "danger" });
    }
    setBusyAction(null);
  }

  const orphanCount = scan?.summary.fileCount ?? 0;
  const canCleanup = orphanCount > 0 && busyAction === null;

  return (
    <Card className="mx-auto w-full max-w-5xl scroll-mt-24" id="orphan-images">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageOff aria-hidden size={20} />
          孤儿图片清理
        </CardTitle>
        <CardDescription>先扫描 uploads 与数据库引用，再确认清理。</CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-soft-border bg-surface-muted px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <ShieldAlert aria-hidden className="text-warning" size={18} />
            清理前会重新扫描，避免删除刚被引用的图片。
          </p>
          <p className="mt-1 text-xs leading-5 text-text-tertiary">
            这里只处理 uploads/items 中没有 ItemImage 记录引用的普通图片文件，跳过非物品目录和不安全路径。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={busyAction !== null}
            leadingIcon={<RefreshCw aria-hidden size={18} />}
            onClick={() => void runScan()}
            variant="secondary"
          >
            {busyAction === "scan" ? "扫描中" : "扫描孤儿图片"}
          </Button>
          <Button
            disabled={!canCleanup}
            leadingIcon={<Trash2 aria-hidden size={18} />}
            onClick={() => void runCleanup()}
            variant="danger"
          >
            {busyAction === "cleanup" ? "清理中" : "确认清理"}
          </Button>
        </div>
        {notice ? <MaintenanceNoticeBox notice={notice} /> : null}
        <OrphanImageScanSummary scan={scan} />
      </div>
    </Card>
  );
}

function OrphanImageScanSummary({ scan }: { scan: OrphanImageScanResult | null }) {
  if (!scan) {
    return <p className="text-sm text-text-tertiary">尚未扫描。</p>;
  }

  if (scan.summary.fileCount === 0) {
    return <p className="rounded-card border border-dashed border-soft-border px-4 py-5 text-sm text-text-secondary">没有发现孤儿图片。</p>;
  }

  return (
    <div className="rounded-card border border-soft-border px-4 py-3">
      <p className="text-sm font-medium text-text-primary">
        发现 {scan.summary.fileCount} 个孤儿图片，共 {formatBytes(scan.summary.totalBytes)}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {scan.files.slice(0, 6).map((file) => (
          <li className="break-all rounded-card bg-surface-muted px-3 py-2 text-xs text-text-secondary" key={file.relativePath}>
            {file.relativePath} · {formatBytes(file.sizeBytes)}
          </li>
        ))}
      </ul>
      {scan.files.length > 6 ? <p className="mt-2 text-xs text-text-tertiary">还有 {scan.files.length - 6} 个文件未显示。</p> : null}
    </div>
  );
}

function MaintenanceNoticeBox({ notice }: { notice: MaintenanceNotice }) {
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

export async function fetchOrphanImageMaintenanceJson(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<MaintenanceResponse> {
  try {
    const response = await fetch(input, init);
    const body = (await response.json().catch(() => ({ message: "请求失败，请稍后重试。" }))) as MaintenanceResponse;
    return { data: body.data, message: body.message ?? "请求失败，请稍后重试。", ok: response.ok };
  } catch {
    return { message: "请求失败，请稍后重试。", ok: false };
  }
}

function isScanResult(data: unknown): data is OrphanImageScanResult {
  if (!isRecord(data) || !isRecord(data.summary) || !Array.isArray(data.files)) {
    return false;
  }

  return (
    typeof data.summary.fileCount === "number" &&
    typeof data.summary.totalBytes === "number" &&
    data.files.every(isOrphanImageFile)
  );
}

function isCleanupResult(data: unknown): data is { results: CleanupResult[] } {
  return isRecord(data) && Array.isArray(data.results) && data.results.every(isCleanupResultItem);
}

function isCleanupResultItem(data: unknown): data is CleanupResult {
  return (
    isOrphanImageFile(data) &&
    isRecord(data) &&
    (data.status === "deleted" || data.status === "failed" || data.status === "skipped")
  );
}

function isOrphanImageFile(data: unknown): data is OrphanImageFile {
  return (
    isRecord(data) &&
    typeof data.filename === "string" &&
    typeof data.itemId === "number" &&
    typeof data.relativePath === "string" &&
    typeof data.sizeBytes === "number"
  );
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  return `${Math.round(value / 1024)} KB`;
}
