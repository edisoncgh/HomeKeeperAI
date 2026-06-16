"use client";

import { AlertTriangle, Check, Sparkles } from "lucide-react";
import React, { FormEvent, ReactNode, useState } from "react";
import {
  AiCandidateConfirmation,
  AiCandidateFieldMeta,
  AiTaxonomyOption,
  applyUserCandidateEdit,
  confirmAiCandidateItem
} from "@/lib/ai/candidate-confirmation";
import type { AiFieldSource } from "@/lib/ai/schemas";
import type { ItemFormState } from "@/lib/inventory/item-view";
import { cn } from "@/lib/class-names";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input, Tag } from "@/components/ui";

interface AiCandidateConfirmationPanelProps {
  categories: AiTaxonomyOption[];
  confirmation: AiCandidateConfirmation;
  locations: AiTaxonomyOption[];
  onConfirmed?: (item: unknown) => void;
  sourceImageFile?: File;
}

type EditableField = keyof ItemFormState;

const sourceLabels: Record<AiFieldSource, string> = {
  image: "图片识别",
  inference: "AI 推断",
  order: "订单识别",
  user: "用户修改"
};

export function AiCandidateConfirmationPanel({
  categories,
  confirmation,
  locations,
  onConfirmed,
  sourceImageFile
}: AiCandidateConfirmationPanelProps) {
  const [state, setState] = useState(confirmation);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: EditableField, value: string) {
    setState((current) => applyUserCandidateEdit(current, field, value));
  }

  async function submitCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");
    const result = await confirmAiCandidateItem(state, fetch, { imageFile: sourceImageFile });
    setIsSaving(false);
    if (result.ok) {
      setFeedback(result.warning ?? "候选已写入物品。");
      onConfirmed?.(result.item);
    } else {
      setFeedback(result.message);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <CandidateHeader confirmation={state} />
      <WarningList warnings={state.warnings} />
      <form className="grid gap-4" onSubmit={submitCandidate}>
        <CandidateFormFields
          categories={categories}
          confirmation={state}
          locations={locations}
          onChange={updateField}
        />
        <NotesField meta={state.fieldMeta.notes} value={state.form.notes} onChange={updateField} />
        <ConfirmationActions feedback={feedback} isSaving={isSaving} />
      </form>
    </Card>
  );
}

function CandidateHeader({ confirmation }: { confirmation: AiCandidateConfirmation }) {
  return (
    <CardHeader className="mb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={18} />
            {confirmation.form.name || "未命名候选"}
          </CardTitle>
          <CardDescription>候选字段可在确认前调整。</CardDescription>
        </div>
        <SourceBadge meta={confirmation.fieldMeta.name} />
      </div>
    </CardHeader>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-card border border-warning/25 bg-[#FFF8ED] p-3">
      {warnings.map((warning) => (
        <p className="flex gap-2 text-sm text-[#8A4B12]" key={warning}>
          <AlertTriangle className="mt-0.5 shrink-0" size={15} />
          <span>{warning}</span>
        </p>
      ))}
    </div>
  );
}

function CandidateFormFields(props: {
  categories: AiTaxonomyOption[];
  confirmation: AiCandidateConfirmation;
  locations: AiTaxonomyOption[];
  onChange: (field: EditableField, value: string) => void;
}) {
  const { confirmation, onChange } = props;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextInputField field="name" label="名称" meta={confirmation.fieldMeta.name} value={confirmation.form.name} onChange={onChange} />
      <TextInputField
        field="quantity"
        inputProps={{ min: 1, type: "number" }}
        label="数量"
        meta={confirmation.fieldMeta.quantity}
        value={confirmation.form.quantity}
        onChange={onChange}
      />
      <TextInputField field="unit" label="数量单位" meta={confirmation.fieldMeta.unit} value={confirmation.form.unit} onChange={onChange} />
      <TextInputField
        field="specification"
        label="规格"
        meta={confirmation.fieldMeta.specification}
        value={confirmation.form.specification}
        onChange={onChange}
      />
      <TaxonomySelect field="categoryId" label="分类" meta={confirmation.fieldMeta.categoryId} options={props.categories} value={confirmation.form.categoryId} onChange={onChange} />
      <TaxonomySelect field="locationId" label="位置" meta={confirmation.fieldMeta.locationId} options={props.locations} value={confirmation.form.locationId} onChange={onChange} />
      <TextInputField field="expiryDate" inputProps={{ type: "date" }} label="保质期" meta={confirmation.fieldMeta.expiryDate} value={confirmation.form.expiryDate} onChange={onChange} />
      <TextInputField field="purchaseDate" inputProps={{ type: "date" }} label="采购日期" meta={confirmation.fieldMeta.purchaseDate} value={confirmation.form.purchaseDate} onChange={onChange} />
      <TextInputField
        field="purchasePrice"
        inputProps={{ min: 0, step: "0.01", type: "number" }}
        label="采购价格"
        meta={confirmation.fieldMeta.purchasePrice}
        value={confirmation.form.purchasePrice}
        onChange={onChange}
      />
    </div>
  );
}

function TextInputField(props: {
  field: EditableField;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  label: string;
  meta?: AiCandidateFieldMeta;
  onChange: (field: EditableField, value: string) => void;
  value: string;
}) {
  return (
    <FieldWithMeta field={props.field} label={props.label} meta={props.meta}>
      <Input
        {...props.inputProps}
        name={props.field}
        onChange={(event) => props.onChange(props.field, event.target.value)}
        value={props.value}
      />
    </FieldWithMeta>
  );
}

function TaxonomySelect(props: {
  field: "categoryId" | "locationId";
  label: string;
  meta?: AiCandidateFieldMeta;
  onChange: (field: EditableField, value: string) => void;
  options: AiTaxonomyOption[];
  value: string;
}) {
  return (
    <FieldWithMeta field={props.field} label={props.label} meta={props.meta}>
      <select
        className="min-h-11 w-full rounded-card border border-soft-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        name={props.field}
        onChange={(event) => props.onChange(props.field, event.target.value)}
        value={props.value}
      >
        <option value="">未选择</option>
        {props.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </FieldWithMeta>
  );
}

function ConfirmationActions({ feedback, isSaving }: { feedback: string; isSaving: boolean }) {
  return (
    <div className="flex flex-col gap-3 border-t border-soft-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className={cn("text-sm", feedback.includes("失败") ? "text-danger" : "text-text-secondary")}>{feedback}</p>
      <Button disabled={isSaving} leadingIcon={<Check size={16} />} type="submit">
        {isSaving ? "写入中..." : "确认入库"}
      </Button>
    </div>
  );
}

function NotesField(props: {
  meta?: AiCandidateFieldMeta;
  onChange: (field: EditableField, value: string) => void;
  value: string;
}) {
  return (
    <FieldWithMeta field="notes" label="备注" meta={props.meta}>
      <textarea
        className="min-h-24 w-full rounded-card border border-soft-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        name="notes"
        onChange={(event) => props.onChange("notes", event.target.value)}
        value={props.value}
      />
    </FieldWithMeta>
  );
}

function FieldWithMeta(props: {
  children: ReactNode;
  field: EditableField;
  label: string;
  meta?: AiCandidateFieldMeta;
}) {
  return (
    <div className="grid gap-2">
      <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-primary">
        {props.label}
        <SourceBadge meta={props.meta} />
      </span>
      {props.children}
      {props.meta?.reason ? <span className="text-xs leading-5 text-text-tertiary">{props.meta.reason}</span> : null}
    </div>
  );
}

function SourceBadge({ meta }: { meta?: AiCandidateFieldMeta }) {
  if (!meta) {
    return null;
  }

  return (
    <Tag tone={meta.source === "user" ? "success" : meta.confidence < 0.4 ? "warning" : "neutral"}>
      {sourceLabels[meta.source]} · 置信度 {Math.round(meta.confidence * 100)}%
    </Tag>
  );
}
