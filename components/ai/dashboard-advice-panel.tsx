"use client";

import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

interface DashboardSuggestion {
  action: string;
  confidence: number;
  reason: string;
  relatedItemIds: number[];
  title: string;
  type: string;
}

const typeLabels: Record<string, string> = {
  complete: "补录",
  consume: "消耗建议",
  organize: "整理",
  relocate: "位置优化",
  verify: "信息核对"
};

export function DashboardAdvicePanel() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DashboardSuggestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleGenerate() {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/dashboard-advice", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || "AI 建议生成失败，请稍后重试。");
      }
      setSuggestions(body.data.suggestions ?? []);
      setWarnings(body.data.warnings ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI 建议生成失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb aria-hidden size={20} />
          AI 智能建议
        </CardTitle>
        <CardDescription>手动生成只读建议，不会自动修改数据或生成预警。</CardDescription>
      </CardHeader>
      <Button disabled={isLoading} leadingIcon={isLoading ? <Loader2 aria-hidden className="animate-spin" size={16} /> : null} onClick={handleGenerate}>
        {isLoading ? "生成中" : "生成建议"}
      </Button>
      {error ? <p className="rounded-card bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      {warnings.length ? <p className="text-sm leading-6 text-text-secondary">{warnings.join("；")}</p> : null}
      <div className="flex flex-col gap-3">
        {suggestions.map((suggestion) => (
          <article className="rounded-card border border-soft-border p-3" key={`${suggestion.type}-${suggestion.title}`}>
            <p className="text-xs font-medium text-primary">{typeLabels[suggestion.type] ?? "建议"}</p>
            <h3 className="mt-1 text-base font-semibold">{suggestion.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{suggestion.reason}</p>
            <p className="mt-2 text-sm leading-6">{suggestion.action}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}
