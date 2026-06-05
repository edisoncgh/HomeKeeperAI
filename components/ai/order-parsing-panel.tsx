"use client";

import React, { FormEvent, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { AiCandidateConfirmationPanel } from "@/components/ai/candidate-confirmation-panel";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { buildAiCandidateConfirmations, type AiCandidateConfirmation, type AiTaxonomyOption } from "@/lib/ai/candidate-confirmation";
import type { AiItemCandidate } from "@/lib/ai/schemas";

interface OrderParsingPanelProps {
  categories: AiTaxonomyOption[];
  locations: AiTaxonomyOption[];
  onItemCreated?: (item: unknown) => void;
}

interface OrderParsingResult {
  categories: AiTaxonomyOption[];
  confirmations: AiCandidateConfirmation[];
  locations: AiTaxonomyOption[];
}

interface OrderParsingApiResponse {
  code: number;
  data?: {
    candidates: AiItemCandidate[];
    categories: AiTaxonomyOption[];
    locations: AiTaxonomyOption[];
    warnings: string[];
  };
  message: string;
}

export function OrderParsingPanel({ categories, locations, onItemCreated }: OrderParsingPanelProps) {
  const [error, setError] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [orderSource, setOrderSource] = useState("");
  const [result, setResult] = useState<OrderParsingResult | null>(null);

  async function chooseImage(file: File | undefined) {
    setError("");
    setResult(null);
    setImageDataUrl(file ? await readFileAsDataUrl(file) : "");
  }

  async function submitParsing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsParsing(true);
    const response = await requestOrderParsing(imageDataUrl, orderSource, { categories, locations });
    setIsParsing(false);
    if (response.ok) {
      setResult(response.result);
    } else {
      setError(response.message);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <OrderParsingHeader />
      <OrderParsingForm
        error={error}
        isParsing={isParsing}
        orderSource={orderSource}
        onChooseImage={chooseImage}
        onOrderSourceChange={setOrderSource}
        onSubmit={submitParsing}
      />
      <OrderParsingResults onItemCreated={onItemCreated} result={result} />
    </Card>
  );
}

function OrderParsingHeader() {
  return (
    <CardHeader className="mb-0">
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="text-primary" size={18} />
        AI 订单解析
      </CardTitle>
      <CardDescription>选择订单截图生成候选；本次解析不会保存订单截图，也可以继续手动添加物品。</CardDescription>
    </CardHeader>
  );
}

function OrderParsingForm(props: {
  error: string;
  isParsing: boolean;
  onChooseImage: (file: File | undefined) => void;
  onOrderSourceChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  orderSource: string;
}) {
  return (
    <form className="grid gap-3" onSubmit={props.onSubmit}>
      <input
        accept="image/*"
        className="min-h-11 w-full rounded-card border border-soft-border bg-surface px-3 py-2 text-sm text-text-secondary file:mr-3 file:rounded-card file:border-0 file:bg-primary-light file:px-3 file:py-2 file:text-primary"
        name="image"
        onChange={(event) => props.onChooseImage(event.target.files?.[0])}
        type="file"
      />
      <input
        className="min-h-11 rounded-card border border-soft-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        name="orderSource"
        onChange={(event) => props.onOrderSourceChange(event.target.value)}
        placeholder="可选：订单来源，例如“京东截图”或“山姆订单”。"
        value={props.orderSource}
      />
      {props.error ? <p className="text-sm text-danger">{props.error}</p> : null}
      <Button disabled={props.isParsing} leadingIcon={<FileText size={16} />} type="submit">
        {props.isParsing ? "解析中..." : "解析候选"}
      </Button>
    </form>
  );
}

function OrderParsingResults(props: {
  onItemCreated?: (item: unknown) => void;
  result: OrderParsingResult | null;
}) {
  if (!props.result) {
    return null;
  }

  return (
    <div className="grid gap-3 border-t border-soft-border pt-4">
      {props.result.confirmations.map((confirmation) => (
        <AiCandidateConfirmationPanel
          categories={props.result?.categories ?? []}
          confirmation={confirmation}
          key={confirmation.id}
          locations={props.result?.locations ?? []}
          onConfirmed={props.onItemCreated}
        />
      ))}
    </div>
  );
}

async function requestOrderParsing(
  imageDataUrl: string,
  orderSource: string,
  fallback: { categories: AiTaxonomyOption[]; locations: AiTaxonomyOption[] }
) {
  const response = await fetch("/api/items/parse-order", {
    body: JSON.stringify({ imageDataUrl, orderSource }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as OrderParsingApiResponse | null;
  if (!response.ok || !payload?.data) {
    return { message: payload?.message ?? "订单解析失败，请稍后重试或手动添加物品。", ok: false as const };
  }
  const responseCategories = payload.data.categories.length ? payload.data.categories : fallback.categories;
  const responseLocations = payload.data.locations.length ? payload.data.locations : fallback.locations;

  return {
    ok: true as const,
    result: {
      categories: responseCategories,
      confirmations: buildAiCandidateConfirmations({
        candidates: payload.data.candidates,
        categories: responseCategories,
        locations: responseLocations,
        today: new Date().toISOString().slice(0, 10),
        warnings: payload.data.warnings
      }),
      locations: responseLocations
    }
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("订单截图读取失败，请重新选择。")));
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
    reader.readAsDataURL(file);
  });
}
