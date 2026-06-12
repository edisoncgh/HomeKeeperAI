"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, ImageIcon, ImagePlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { ItemImageView } from "@/components/inventory/item-manager";

interface ItemImageManagerProps {
  images: ItemImageView[];
  isBusy: boolean;
  itemName: string;
  onDelete: (imageId: number) => Promise<{ message?: string; ok: boolean }>;
  onMove: (imageId: number, direction: "down" | "up") => Promise<{ message?: string; ok: boolean }>;
  onSetPrimary: (imageId: number) => Promise<{ message?: string; ok: boolean }>;
  onUpload: (file: File) => Promise<{ message?: string; ok: boolean }>;
}

export function ItemImageManager({ images, isBusy, itemName, onDelete, onMove, onSetPrimary, onUpload }: ItemImageManagerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setFeedback("");
    const result = await onUpload(file);
    setFeedback(result.ok ? "图片已保存到物品。" : result.message ?? "图片保存失败，请重试。");
  }

  async function handleDelete(image: ItemImageView) {
    if (typeof window !== "undefined" && !window.confirm(getDeleteImageConfirmationMessage(image))) {
      return;
    }

    setFeedback("");
    const result = await onDelete(image.id);
    setFeedback(result.ok ? "图片已删除。" : result.message ?? "图片删除失败，请重试。");
  }

  async function handleSetPrimary(imageId: number) {
    setFeedback("");
    const result = await onSetPrimary(imageId);
    setFeedback(result.ok ? "主图已更新。" : result.message ?? "主图设置失败，请重试。");
  }

  async function handleMove(imageId: number, direction: "down" | "up") {
    setFeedback("");
    const result = await onMove(imageId, direction);
    setFeedback(result.ok ? "图片顺序已更新。" : result.message ?? "图片排序失败，请重试。");
  }

  return (
    <section className="mt-5 border-t border-soft-border pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">物品图片</h3>
          <p className="mt-1 text-xs leading-5 text-text-tertiary">支持本地上传；手机端可直接拍照保存到当前物品。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            accept="image/*"
            capture="environment"
            className="hidden md:hidden"
            onChange={handleFileChange}
            ref={cameraInputRef}
            type="file"
          />
          <input accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
          <Button
            disabled={isBusy}
            leadingIcon={<Camera aria-hidden size={16} />}
            onClick={() => cameraInputRef.current?.click()}
            variant="secondary"
          >
            拍照
          </Button>
          <Button
            disabled={isBusy}
            leadingIcon={<ImagePlus aria-hidden size={16} />}
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
          >
            上传
          </Button>
        </div>
      </div>
      {images.length === 0 ? (
        <EmptyImageNotice />
      ) : (
        <ImageGrid
          images={images}
          isBusy={isBusy}
          itemName={itemName}
          onDelete={handleDelete}
          onMove={handleMove}
          onSetPrimary={handleSetPrimary}
        />
      )}
      {feedback ? <p className="mt-3 text-sm text-text-secondary">{feedback}</p> : null}
    </section>
  );
}

export function getDeleteImageConfirmationMessage(image: ItemImageView) {
  if (image.isPrimary) {
    return "删除这张图片？这张是当前主图，删除后系统会自动选择下一张图片作为主图；如果没有其他图片，则会清空主图。";
  }

  return "删除这张图片？删除后将无法从物品图片栏恢复。";
}

function EmptyImageNotice() {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-card border border-dashed border-soft-border px-3 py-4 text-sm text-text-secondary">
      <ImageIcon aria-hidden className="text-text-tertiary" size={20} />
      <span>还没有图片。可以上传本地图片，或在手机端拍照保存。</span>
    </div>
  );
}

function ImageGrid(props: {
  images: ItemImageView[];
  isBusy: boolean;
  itemName: string;
  onDelete: (image: ItemImageView) => void;
  onMove: (imageId: number, direction: "down" | "up") => void;
  onSetPrimary: (imageId: number) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {props.images.map((image, index) => (
        <div className="group relative overflow-hidden rounded-card border border-soft-border bg-surface-secondary" key={image.id}>
          <img
            alt={`${props.itemName} 图片`}
            className="aspect-square w-full object-cover"
            src={image.thumbnailUrl || image.url}
          />
          {image.isPrimary ? (
            <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">
              主图
            </span>
          ) : null}
          <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
            <button
              aria-label="上移图片"
              className="rounded-full bg-white/90 p-1 text-text-secondary shadow-sm transition hover:bg-white disabled:opacity-45"
              disabled={props.isBusy || index === 0}
              onClick={() => props.onMove(image.id, "up")}
              type="button"
            >
              <ArrowUp aria-hidden size={14} />
            </button>
            <button
              aria-label="下移图片"
              className="rounded-full bg-white/90 p-1 text-text-secondary shadow-sm transition hover:bg-white disabled:opacity-45"
              disabled={props.isBusy || index === props.images.length - 1}
              onClick={() => props.onMove(image.id, "down")}
              type="button"
            >
              <ArrowDown aria-hidden size={14} />
            </button>
          </div>
          {!image.isPrimary ? (
            <button
              aria-label="设为主图"
              className="absolute left-1 top-1 rounded-full bg-white/90 p-1 text-primary shadow-sm transition hover:bg-white"
              disabled={props.isBusy}
              onClick={() => props.onSetPrimary(image.id)}
              type="button"
            >
              <Star aria-hidden size={14} />
            </button>
          ) : null}
          <button
            aria-label="删除图片"
            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-danger shadow-sm transition hover:bg-white"
            disabled={props.isBusy}
            onClick={() => props.onDelete(image)}
            type="button"
          >
            <Trash2 aria-hidden size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
