"use client";

import React, { FormEvent, useRef, useState } from "react";
import { Camera, ImagePlus, Sparkles } from "lucide-react";
import { AiCandidateConfirmationPanel } from "@/components/ai/candidate-confirmation-panel";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { buildAiCandidateConfirmations, type AiCandidateConfirmation, type AiTaxonomyOption } from "@/lib/ai/candidate-confirmation";
import type { AiItemCandidate } from "@/lib/ai/schemas";

interface PhotoRecognitionPanelProps {
  categories: AiTaxonomyOption[];
  locations: AiTaxonomyOption[];
  onItemCreated?: (item: unknown) => void;
}

interface RecognitionResult {
  categories: AiTaxonomyOption[];
  confirmations: AiCandidateConfirmation[];
  locations: AiTaxonomyOption[];
}

interface RecognitionApiResponse {
  code: number;
  data?: {
    candidates: AiItemCandidate[];
    categories: AiTaxonomyOption[];
    locations: AiTaxonomyOption[];
    warnings: string[];
  };
  message: string;
}

export function PhotoRecognitionPanel({ categories, locations, onItemCreated }: PhotoRecognitionPanelProps) {
  const [error, setError] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [userHint, setUserHint] = useState("");

  async function chooseImage(file: File | undefined) {
    setError("");
    setResult(null);
    setImageDataUrl(file ? await readFileAsDataUrl(file) : "");
  }

  async function submitRecognition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsRecognizing(true);
    const response = await requestPhotoRecognition(imageDataUrl, userHint, { categories, locations });
    setIsRecognizing(false);
    if (response.ok) {
      setResult(response.result);
    } else {
      setError(response.message);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <RecognitionHeader />
      <RecognitionForm
        error={error}
        isRecognizing={isRecognizing}
        userHint={userHint}
        onChooseImage={chooseImage}
        onSubmit={submitRecognition}
        onUserHintChange={setUserHint}
      />
      <RecognitionResults onItemCreated={onItemCreated} result={result} />
    </Card>
  );
}

function RecognitionHeader() {
  return (
    <CardHeader className="mb-0">
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="text-primary" size={18} />
        AI 拍照识别
      </CardTitle>
      <CardDescription>手机端可直接拍照生成候选；本次识别不会保存图片，也可以继续手动添加物品。</CardDescription>
    </CardHeader>
  );
}

function RecognitionForm(props: {
  error: string;
  isRecognizing: boolean;
  onChooseImage: (file: File | undefined) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUserHintChange: (value: string) => void;
  userHint: string;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  return (
    <form className="grid gap-3" onSubmit={props.onSubmit}>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          accept="image/*"
          capture="environment"
          className="hidden md:hidden"
          name="cameraImage"
          onChange={(event) => props.onChooseImage(event.target.files?.[0])}
          ref={cameraInputRef}
          type="file"
        />
        <input
          accept="image/*"
          className="hidden"
          name="galleryImage"
          onChange={(event) => props.onChooseImage(event.target.files?.[0])}
          ref={galleryInputRef}
          type="file"
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#43AA7F] md:hidden"
          onClick={() => cameraInputRef.current?.click()}
          type="button"
        >
          <Camera size={16} />
          拍照导入
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card border border-soft-border bg-surface px-4 text-sm font-medium text-text-primary transition hover:border-primary hover:text-primary"
          onClick={() => galleryInputRef.current?.click()}
          type="button"
        >
          <ImagePlus size={16} />
          从相册选择
        </button>
      </div>
      <textarea
        className="min-h-20 rounded-card border border-soft-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        name="userHint"
        onChange={(event) => props.onUserHintChange(event.target.value)}
        placeholder="可选：补充这张图里的物品背景，例如“冰箱里的水果”。"
        value={props.userHint}
      />
      {props.error ? <p className="text-sm text-danger">{props.error}</p> : null}
      <Button disabled={props.isRecognizing} leadingIcon={<Camera size={16} />} type="submit">
        {props.isRecognizing ? "识别中..." : "识别候选"}
      </Button>
    </form>
  );
}

function RecognitionResults(props: {
  onItemCreated?: (item: unknown) => void;
  result: RecognitionResult | null;
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

async function requestPhotoRecognition(
  imageDataUrl: string,
  userHint: string,
  fallback: { categories: AiTaxonomyOption[]; locations: AiTaxonomyOption[] }
) {
  const response = await fetch("/api/items/recognize", {
    body: JSON.stringify({ imageDataUrl, userHint }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as RecognitionApiResponse | null;
  if (!response.ok || !payload?.data) {
    return { message: payload?.message ?? "拍照识别失败，请稍后重试或手动添加物品。", ok: false as const };
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
    reader.addEventListener("error", () => reject(new Error("图片读取失败，请重新选择。")));
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
    reader.readAsDataURL(file);
  });
}
