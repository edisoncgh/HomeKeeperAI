"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input, Tag } from "@/components/ui";
import { getTaxonomyIconOptions } from "@/lib/inventory/taxonomy-icon-options";

export interface TaxonomyItemView {
  color: null | string;
  createdAt: string;
  description: null | string;
  icon: null | string;
  id: number;
  name: string;
}

interface TaxonomyManagerProps {
  apiPath: string;
  emptyActionLabel: string;
  emptyText: string;
  initialItems: TaxonomyItemView[];
  resourceLabel: "位置" | "分类";
  title: string;
}

interface TaxonomyFormState {
  color: string;
  description: string;
  icon: string;
  name: string;
}

interface TaxonomyManagerState {
  editingItemId: null | number;
  error: string;
  form: TaxonomyFormState;
  isEditing: boolean;
  isSubmitting: boolean;
  items: TaxonomyItemView[];
  resetForm: () => void;
  setError: (value: string) => void;
  setForm: (value: TaxonomyFormState) => void;
  setIsSubmitting: (value: boolean) => void;
  setItems: (value: (items: TaxonomyItemView[]) => TaxonomyItemView[]) => void;
  setSuccess: (value: string) => void;
  startEdit: (item: TaxonomyItemView) => void;
  success: string;
}

const emptyForm: TaxonomyFormState = {
  color: "",
  description: "",
  icon: "",
  name: ""
};

export function TaxonomyManager({
  apiPath,
  emptyActionLabel,
  emptyText,
  initialItems,
  resourceLabel,
  title
}: TaxonomyManagerProps) {
  const state = useTaxonomyManagerState(initialItems);
  const actions = useTaxonomyActions({ apiPath, resourceLabel, state });

  return (
    <TaxonomyManagerLayout
      actions={actions}
      emptyActionLabel={emptyActionLabel}
      emptyText={emptyText}
      resourceLabel={resourceLabel}
      state={state}
      title={title}
    />
  );
}

function TaxonomyManagerLayout({
  actions,
  emptyActionLabel,
  emptyText,
  resourceLabel,
  state,
  title
}: {
  actions: ReturnType<typeof useTaxonomyActions>;
  emptyActionLabel: string;
  emptyText: string;
  resourceLabel: "位置" | "分类";
  state: TaxonomyManagerState;
  title: string;
}) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-5">
      <TaxonomyHeader itemCount={state.items.length} resourceLabel={resourceLabel} title={title} />
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <TaxonomyForm
          error={state.error}
          form={state.form}
          isEditing={state.isEditing}
          isSubmitting={state.isSubmitting}
          onChange={state.setForm}
          onReset={state.resetForm}
          onSubmit={actions.handleSubmit}
          resourceLabel={resourceLabel}
          success={state.success}
        />
        <TaxonomyList
          emptyActionLabel={emptyActionLabel}
          emptyText={emptyText}
          items={state.items}
          onCreate={state.resetForm}
          onDelete={actions.handleDelete}
          onEdit={state.startEdit}
          resourceLabel={resourceLabel}
        />
      </div>
    </section>
  );
}

function useTaxonomyManagerState(initialItems: TaxonomyItemView[]): TaxonomyManagerState {
  const [editingItemId, setEditingItemId] = useState<null | number>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  function resetForm() {
    setEditingItemId(null);
    setForm(emptyForm);
  }

  function startEdit(item: TaxonomyItemView) {
    setEditingItemId(item.id);
    setError("");
    setSuccess("");
    setForm(getFormFromItem(item));
  }

  return {
    editingItemId,
    error,
    form,
    isEditing: editingItemId !== null,
    isSubmitting,
    items,
    resetForm,
    setError,
    setForm,
    setIsSubmitting,
    setItems,
    setSuccess,
    startEdit,
    success
  };
}

function useTaxonomyActions({
  apiPath,
  resourceLabel,
  state
}: {
  apiPath: string;
  resourceLabel: "位置" | "分类";
  state: TaxonomyManagerState;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    beginSubmit(state);

    const response = await saveTaxonomyItem(apiPath, state.form, state.editingItemId);
    state.setIsSubmitting(false);

    if (!response.ok) {
      state.setError(response.message);
      return;
    }

    state.setItems((currentItems) => upsertItem(currentItems, response.item));
    state.setSuccess(`${resourceLabel}已${state.isEditing ? "更新" : "创建"}。`);
    state.resetForm();
  }

  async function handleDelete(item: TaxonomyItemView) {
    if (!window.confirm(`删除${resourceLabel}“${item.name}”？已关联物品会变为未设置。`)) {
      return;
    }

    const response = await deleteTaxonomyItem(apiPath, item.id);
    handleDeleteResponse({ item, resourceLabel, response, state });
  }

  return { handleDelete, handleSubmit };
}

function beginSubmit(state: TaxonomyManagerState) {
  state.setIsSubmitting(true);
  state.setError("");
  state.setSuccess("");
}

function getFormFromItem(item: TaxonomyItemView) {
  return {
    color: item.color ?? "",
    description: item.description ?? "",
    icon: item.icon ?? "",
    name: item.name
  };
}

function handleDeleteResponse({
  item,
  resourceLabel,
  response,
  state
}: {
  item: TaxonomyItemView;
  resourceLabel: "位置" | "分类";
  response: Awaited<ReturnType<typeof deleteTaxonomyItem>>;
  state: TaxonomyManagerState;
}) {
  if (!response.ok) {
    state.setError(response.message);
    return;
  }

  state.setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
  state.setSuccess(`${resourceLabel}已删除。`);
  if (state.editingItemId === item.id) {
    state.resetForm();
  }
}

function TaxonomyHeader({
  itemCount,
  resourceLabel,
  title
}: {
  itemCount: number;
  resourceLabel: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">M2.1 {resourceLabel}管理</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">{title}</h1>
      </div>
      <Tag tone="success">{itemCount} 个{resourceLabel}</Tag>
    </div>
  );
}

function TaxonomyForm({
  error,
  form,
  isEditing,
  isSubmitting,
  onChange,
  onReset,
  onSubmit,
  resourceLabel,
  success
}: {
  error: string;
  form: TaxonomyFormState;
  isEditing: boolean;
  isSubmitting: boolean;
  onChange: (form: TaxonomyFormState) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  resourceLabel: "位置" | "分类";
  success: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? `编辑${resourceLabel}` : `新建${resourceLabel}`}</CardTitle>
        <CardDescription>名称必填，图标、颜色和描述可选。</CardDescription>
      </CardHeader>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <TaxonomyFields form={form} onChange={onChange} resourceLabel={resourceLabel} />
        <TaxonomyFeedback error={error} success={success} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={isSubmitting} leadingIcon={<CheckCircle2 aria-hidden size={16} />} type="submit">
            {isSubmitting ? "保存中" : isEditing ? "保存修改" : `创建${resourceLabel}`}
          </Button>
          {isEditing ? (
            <Button leadingIcon={<X aria-hidden size={16} />} onClick={onReset} variant="ghost">
              取消编辑
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function TaxonomyFields({
  form,
  onChange,
  resourceLabel
}: {
  form: TaxonomyFormState;
  onChange: (form: TaxonomyFormState) => void;
  resourceLabel: "位置" | "分类";
}) {
  return (
    <>
      <Input
        label={`${resourceLabel}名称`}
        name="name"
        onChange={(event) => onChange({ ...form, name: event.target.value })}
        placeholder={resourceLabel === "分类" ? "例如：食品" : "例如：厨房"}
        value={form.name}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          helperText="可直接输入 emoji，或从下方选择。"
          label="图标"
          name="icon"
          onChange={(event) => onChange({ ...form, icon: event.target.value })}
          placeholder={resourceLabel === "分类" ? "例如：🍎" : "例如：🍳"}
          value={form.icon}
        />
        <Input
          label="颜色"
          name="color"
          onChange={(event) => onChange({ ...form, color: event.target.value })}
          placeholder="#4FBF8F"
          value={form.color}
        />
      </div>
      <IconSuggestions onSelect={(icon) => onChange({ ...form, icon })} resourceLabel={resourceLabel} />
      <Input
        label="描述"
        name="description"
        onChange={(event) => onChange({ ...form, description: event.target.value })}
        placeholder="补充这个条目的用途"
        value={form.description}
      />
    </>
  );
}

function IconSuggestions({
  onSelect,
  resourceLabel
}: {
  onSelect: (icon: string) => void;
  resourceLabel: "位置" | "分类";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {getTaxonomyIconOptions(resourceLabel).map((option) => (
        <button
          aria-label={`使用${option.label}图标${option.emoji}`}
          className="min-h-11 rounded-card border border-soft-border bg-surface px-3 text-sm text-text-primary transition hover:border-primary hover:bg-primary-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          key={`${option.emoji}-${option.label}`}
          onClick={() => onSelect(option.emoji)}
          type="button"
        >
          <span aria-hidden>{option.emoji}</span>
          <span className="ml-1">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function TaxonomyFeedback({ error, success }: { error: string; success: string }) {
  if (error) {
    return <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>;
  }

  if (success) {
    return <p className="rounded-card bg-primary-light px-3 py-2 text-sm text-primary">{success}</p>;
  }

  return null;
}

function TaxonomyList({
  emptyActionLabel,
  emptyText,
  items,
  onCreate,
  onDelete,
  onEdit,
  resourceLabel
}: {
  emptyActionLabel: string;
  emptyText: string;
  items: TaxonomyItemView[];
  onCreate: () => void;
  onDelete: (item: TaxonomyItemView) => void;
  onEdit: (item: TaxonomyItemView) => void;
  resourceLabel: "位置" | "分类";
}) {
  if (items.length === 0) {
    return <TaxonomyEmptyState actionLabel={emptyActionLabel} emptyText={emptyText} onCreate={onCreate} />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {items.map((item) => (
        <TaxonomyCard item={item} key={item.id} onDelete={onDelete} onEdit={onEdit} resourceLabel={resourceLabel} />
      ))}
    </div>
  );
}

function TaxonomyEmptyState({
  actionLabel,
  emptyText,
  onCreate
}: {
  actionLabel: string;
  emptyText: string;
  onCreate: () => void;
}) {
  return (
    <Card className="flex min-h-60 flex-col items-start justify-center gap-4">
      <p className="text-base font-semibold text-text-primary">{emptyText}</p>
      <Button leadingIcon={<Plus aria-hidden size={16} />} onClick={onCreate}>
        {actionLabel}
      </Button>
    </Card>
  );
}

function TaxonomyCard({
  item,
  onDelete,
  onEdit,
  resourceLabel
}: {
  item: TaxonomyItemView;
  onDelete: (item: TaxonomyItemView) => void;
  onEdit: (item: TaxonomyItemView) => void;
  resourceLabel: "位置" | "分类";
}) {
  return (
    <Card className="flex min-h-44 flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ColorSwatch color={item.color} />
            <h2 className="truncate text-lg font-semibold text-text-primary">{item.name}</h2>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {item.description || `暂无${resourceLabel}描述。`}
          </p>
        </div>
        {item.icon ? <Tag>{item.icon}</Tag> : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button leadingIcon={<Pencil aria-hidden size={16} />} onClick={() => onEdit(item)} variant="secondary">
          编辑
        </Button>
        <Button leadingIcon={<Trash2 aria-hidden size={16} />} onClick={() => onDelete(item)} variant="danger">
          删除
        </Button>
      </div>
    </Card>
  );
}

function ColorSwatch({ color }: { color: null | string }) {
  return (
    <span
      className="size-4 shrink-0 rounded-full border border-soft-border"
      style={{ backgroundColor: color || "#EAF8F1" }}
    />
  );
}

async function saveTaxonomyItem(apiPath: string, form: TaxonomyFormState, editingItemId: null | number) {
  const path = editingItemId ? `${apiPath}/${editingItemId}` : apiPath;
  const method = editingItemId ? "PUT" : "POST";
  return requestTaxonomyItem(path, { body: JSON.stringify(form), method });
}

async function deleteTaxonomyItem(apiPath: string, id: number) {
  return requestTaxonomyItem(`${apiPath}/${id}`, { method: "DELETE" });
}

async function requestTaxonomyItem(path: string, init: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" }
  });
  const payload = (await response.json().catch(() => null)) as TaxonomyApiResponse;

  if (!response.ok || !isTaxonomySuccessPayload(payload)) {
    return { message: payload?.message ?? "操作失败，请稍后重试。", ok: false as const };
  }

  return { item: payload.data.item, ok: true as const };
}

function upsertItem(items: TaxonomyItemView[], item: TaxonomyItemView) {
  const nextItems = items.some((currentItem) => currentItem.id === item.id)
    ? items.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
    : [...items, item];

  return nextItems.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
}

function isTaxonomySuccessPayload(payload: TaxonomyApiResponse): payload is TaxonomySuccessResponse {
  return Boolean(payload && payload.code === 0 && typeof payload.data === "object" && payload.data);
}

interface TaxonomySuccessResponse {
  code: 0;
  data: { item: TaxonomyItemView };
  message: string;
}

interface TaxonomyErrorResponse {
  code: number;
  data?: unknown;
  message: string;
}

type TaxonomyApiResponse = TaxonomyErrorResponse | TaxonomySuccessResponse | null;
