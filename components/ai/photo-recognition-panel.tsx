"use client";

import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Sparkles } from "lucide-react";
import { AiCandidateConfirmationPanel } from "@/components/ai/candidate-confirmation-panel";
import { useCameraIntake } from "@/components/ai/camera-shortcut-button";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { buildAiCandidateConfirmations, type AiCandidateConfirmation, type AiTaxonomyOption } from "@/lib/ai/candidate-confirmation";
import type { AiItemCandidate } from "@/lib/ai/schemas";

interface PhotoRecognitionPanelProps {
  autoOpenCameraToken?: number;
  categories: AiTaxonomyOption[];
  initialExpanded?: boolean;
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

export function PhotoRecognitionPanel({
  autoOpenCameraToken,
  categories,
  initialExpanded = true,
  locations,
  onItemCreated
}: PhotoRecognitionPanelProps) {
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(initialExpanded || Boolean(autoOpenCameraToken));
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState("等待开始识别");
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [userHint, setUserHint] = useState("");
  const { clearPendingPhoto, pendingPhoto } = useCameraIntake();

  useEffect(() => {
    if (autoOpenCameraToken) {
      setIsExpanded(true);
    }
  }, [autoOpenCameraToken]);

  const chooseImage = useCallback(async (file: File | undefined) => {
    setError("");
    setResult(null);
    setImageFile(file ?? null);
    setImageDataUrl(file ? await readFileAsDataUrl(file) : "");
    setRecognitionStatus(file ? "图片已选择，可以开始识别" : "等待开始识别");
  }, []);

  useEffect(() => {
    if (!pendingPhoto) {
      return;
    }

    setIsExpanded(true);
    void chooseImage(pendingPhoto.file)
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : "图片读取失败，请重新选择。");
        setRecognitionStatus("图片读取失败，请重新选择");
      })
      .finally(() => clearPendingPhoto(pendingPhoto.id));
  }, [chooseImage, clearPendingPhoto, pendingPhoto]);

  async function submitRecognition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageDataUrl) {
      setError("请先拍照或从相册选择图片。");
      setRecognitionStatus("等待选择图片");
      return;
    }

    setError("");
    setIsRecognizing(true);
    setRecognitionStatus("正在识别图片内容并生成候选字段");
    const response = await requestPhotoRecognition(imageDataUrl, userHint, { categories, locations });
    setIsRecognizing(false);
    if (response.ok) {
      setResult(response.result);
      setRecognitionStatus("识别完成，请核对候选字段");
    } else {
      setError(response.message);
      setRecognitionStatus("识别失败，可以调整补充说明后重试");
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <RecognitionHeader />
        <button
          className="min-h-9 rounded-card px-2 text-sm font-medium text-primary transition hover:bg-primary-light"
          onClick={() => setIsExpanded((value) => !value)}
          type="button"
        >
          {isExpanded ? "收起" : "展开"}
        </button>
      </div>
      {isExpanded ? (
        <>
          <RecognitionForm
            autoOpenCameraToken={autoOpenCameraToken}
            error={error}
            imageDataUrl={imageDataUrl}
            imageFile={imageFile}
            isRecognizing={isRecognizing}
            recognitionStatus={recognitionStatus}
            userHint={userHint}
            onChooseImage={chooseImage}
            onSubmit={submitRecognition}
            onUserHintChange={setUserHint}
          />
          <RecognitionResults onItemCreated={onItemCreated} result={result} sourceImageFile={imageFile} />
        </>
      ) : (
        <p className="text-sm leading-6 text-text-secondary">拍照或选择图片，让 AI 生成可确认的入库候选。</p>
      )}
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
      <CardDescription>手机端可直接拍照生成候选；确认入库后会把本次图片保存到对应物品。</CardDescription>
    </CardHeader>
  );
}

function RecognitionForm(props: {
  autoOpenCameraToken?: number;
  error: string;
  imageDataUrl: string;
  imageFile: File | null;
  isRecognizing: boolean;
  onChooseImage: (file: File | undefined) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUserHintChange: (value: string) => void;
  recognitionStatus: string;
  userHint: string;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.autoOpenCameraToken) {
      cameraInputRef.current?.click();
    }
  }, [props.autoOpenCameraToken]);

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
      <RecognitionPreview imageDataUrl={props.imageDataUrl} imageFile={props.imageFile} />
      <RecognitionStatus isRecognizing={props.isRecognizing} text={props.recognitionStatus} />
      {props.error ? <p className="text-sm text-danger">{props.error}</p> : null}
      <Button disabled={props.isRecognizing} leadingIcon={<Camera size={16} />} type="submit">
        {props.isRecognizing ? "识别中..." : "识别候选"}
      </Button>
    </form>
  );
}

function RecognitionPreview({ imageDataUrl, imageFile }: { imageDataUrl: string; imageFile: File | null }) {
  return (
    <div className="rounded-card border border-dashed border-soft-border p-3">
      <p className="text-sm font-medium text-text-primary">图片预览</p>
      {imageDataUrl ? (
        <div className="mt-3 flex gap-3">
          {/* Data URL preview comes from the current local file before it is uploaded. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="待识别图片预览" className="size-24 rounded-card object-cover" src={imageDataUrl} />
          <div className="min-w-0 text-sm text-text-secondary">
            <p className="truncate">{imageFile?.name ?? "已选择图片"}</p>
            <p className="mt-1 text-xs text-text-tertiary">
              {imageFile ? `${Math.max(1, Math.round(imageFile.size / 1024))} KB` : ""}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-text-tertiary">选择图片后会在这里显示预览。</p>
      )}
    </div>
  );
}

function RecognitionStatus({ isRecognizing, text }: { isRecognizing: boolean; text: string }) {
  return (
    <div className="rounded-card border border-soft-border bg-primary-light px-3 py-2 text-sm text-text-primary" role="status">
      <span className="font-medium">识别进度：</span>
      {isRecognizing ? "识别中，通常需要几十秒。" : text}
    </div>
  );
}

function RecognitionResults(props: {
  onItemCreated?: (item: unknown) => void;
  result: RecognitionResult | null;
  sourceImageFile: File | null;
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
          sourceImageFile={props.sourceImageFile ?? undefined}
        />
      ))}
    </div>
  );
}

export async function requestPhotoRecognition(
  imageDataUrl: string,
  userHint: string,
  fallback: { categories: AiTaxonomyOption[]; locations: AiTaxonomyOption[] }
) {
  let response: Response;
  try {
    response = await fetch("/api/items/recognize", {
      body: JSON.stringify({ imageDataUrl, userHint }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
  } catch {
    return { message: "网络异常，拍照识别失败，请稍后重试或手动添加物品。", ok: false as const };
  }

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
