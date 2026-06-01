"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, PlugZap, RotateCcw, Save, ServerCog, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LlmSettingsView } from "@/lib/settings/llm";

type ApiKeyAction = "clear" | "keep" | "replace";
type NoticeTone = "danger" | "success";

interface Notice {
  message: string;
  tone: NoticeTone;
}

interface LlmSettingsPanelProps {
  initialSettings: LlmSettingsView;
}

export function LlmSettingsPanel({ initialSettings }: LlmSettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyAction, setApiKeyAction] = useState<ApiKeyAction>("keep");
  const [baseUrl, setBaseUrl] = useState(initialSettings.baseUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [model, setModel] = useState(initialSettings.model);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [settings, setSettings] = useState(initialSettings);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);
    const response = await fetchJson("/api/settings/llm", {
      body: JSON.stringify({ apiKey, apiKeyAction, baseUrl, model }),
      headers: { "content-type": "application/json" },
      method: "PUT"
    });
    setIsSaving(false);
    handleSettingsResponse(response);
  }

  async function handleHealthCheck() {
    setIsTesting(true);
    setNotice(null);
    const response = await fetchJson("/api/ai/health");
    setIsTesting(false);
    setNotice({
      message: response.ok ? "LLM 连接正常。" : response.message,
      tone: response.ok ? "success" : "danger"
    });
  }

  function handleSettingsResponse(response: JsonResponse) {
    if (!response.ok) {
      setNotice({ message: response.message, tone: "danger" });
      return;
    }

    const nextSettings = response.data?.settings as LlmSettingsView | undefined;
    if (nextSettings) {
      setSettings(nextSettings);
      setBaseUrl(nextSettings.baseUrl);
      setModel(nextSettings.model);
    }
    setApiKey("");
    setApiKeyAction("keep");
    setNotice({ message: "设置已保存。", tone: "success" });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SettingsHeader />
      <Card className="p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form className="flex flex-col gap-5 p-4 sm:p-6" onSubmit={handleSubmit}>
            <CardHeader className="mb-0 px-0">
              <CardTitle className="flex items-center gap-2">
                <ServerCog aria-hidden size={20} />
                LLM 服务
              </CardTitle>
              <CardDescription>OpenAI 兼容接口、局域网 Ollama 或自定义服务。</CardDescription>
            </CardHeader>
            <Input
              label="Base URL"
              name="baseUrl"
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
            />
            <Input
              label="模型"
              name="model"
              onChange={(event) => setModel(event.target.value)}
              placeholder="gpt-4.1-mini 或 llama3.2-vision"
              value={model}
            />
            <ApiKeyControls
              apiKey={apiKey}
              apiKeyAction={apiKeyAction}
              isConfigured={settings.apiKeyConfigured}
              setApiKey={setApiKey}
              setApiKeyAction={setApiKeyAction}
            />
            {notice ? <NoticeBox notice={notice} /> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button disabled={isSaving} leadingIcon={<Save aria-hidden size={18} />} type="submit">
                {isSaving ? "保存中" : "保存设置"}
              </Button>
              <Button
                disabled={isTesting || isSaving}
                leadingIcon={<PlugZap aria-hidden size={18} />}
                onClick={handleHealthCheck}
                type="button"
                variant="secondary"
              >
                {isTesting ? "测试中" : "测试连接"}
              </Button>
            </div>
          </form>
          <SettingsSummary settings={settings} />
        </div>
      </Card>
    </div>
  );
}

function SettingsHeader() {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-sm font-medium text-primary">系统设置</p>
      <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">AI 服务配置</h1>
    </header>
  );
}

function ApiKeyControls({
  apiKey,
  apiKeyAction,
  isConfigured,
  setApiKey,
  setApiKeyAction
}: {
  apiKey: string;
  apiKeyAction: ApiKeyAction;
  isConfigured: boolean;
  setApiKey: (value: string) => void;
  setApiKeyAction: (value: ApiKeyAction) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-primary">API Key</span>
        <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
          {isConfigured ? "已配置" : "未配置"}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <ToggleButton isActive={apiKeyAction === "keep"} onClick={() => setApiKeyAction("keep")}>
          保持
        </ToggleButton>
        <ToggleButton isActive={apiKeyAction === "replace"} onClick={() => setApiKeyAction("replace")}>
          替换
        </ToggleButton>
        <ToggleButton isActive={apiKeyAction === "clear"} onClick={() => setApiKeyAction("clear")}>
          清空
        </ToggleButton>
      </div>
      {apiKeyAction === "replace" ? (
        <Input
          label="新的 API Key"
          leadingIcon={<KeyRound aria-hidden size={18} />}
          name="apiKey"
          onChange={(event) => setApiKey(event.target.value)}
          type="password"
          value={apiKey}
        />
      ) : null}
    </div>
  );
}

function ToggleButton({ children, isActive, onClick }: { children: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      className={[
        "min-h-11 rounded-card border px-3 text-sm font-medium transition",
        isActive ? "border-primary bg-primary text-white" : "border-soft-border bg-surface text-text-secondary"
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  const Icon = notice.tone === "success" ? CheckCircle2 : XCircle;
  return (
    <div
      className={[
        "flex items-start gap-2 rounded-card border px-3 py-2 text-sm",
        notice.tone === "success"
          ? "border-primary bg-primary-light text-text-primary"
          : "border-danger bg-[#FDEDEC] text-text-primary"
      ].join(" ")}
      role="status"
    >
      <Icon aria-hidden className={notice.tone === "success" ? "text-primary" : "text-danger"} size={18} />
      <span>{notice.message}</span>
    </div>
  );
}

function SettingsSummary({ settings }: { settings: LlmSettingsView }) {
  return (
    <aside className="border-t border-soft-border bg-primary-light/40 p-4 sm:p-6 lg:border-l lg:border-t-0">
      <div className="flex h-full flex-col gap-4">
        <div className="grid size-11 place-items-center rounded-card bg-primary text-white">
          <RotateCcw aria-hidden size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">当前状态</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <SummaryRow label="Base URL" value={settings.baseUrl || "未配置"} />
            <SummaryRow label="模型" value={settings.model || "未配置"} />
            <SummaryRow label="API Key" value={settings.apiKeyConfigured ? "已配置" : "未配置"} />
          </dl>
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-text-tertiary">{label}</dt>
      <dd className="break-all text-text-primary">{value}</dd>
    </div>
  );
}

type JsonResponse = { data?: Record<string, unknown>; message: string; ok: boolean };

async function fetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<JsonResponse> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => ({ message: "请求失败，请稍后重试。" }))) as {
    data?: Record<string, unknown>;
    message?: string;
  };
  return { data: body.data, message: body.message ?? "请求失败，请稍后重试。", ok: response.ok };
}
