"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, PackagePlus, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { OrderParsingPanel, PhotoRecognitionPanel } from "@/components/ai";
import { ExpiryDateField } from "@/components/inventory/expiry-date-field";
import { ItemImageManager } from "@/components/inventory/item-image-manager";
import { ItemListControls, type PaginationView } from "@/components/inventory/item-list-controls";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input, Tag } from "@/components/ui";
import {
  buildItemListSearchParams,
  buildItemPayload,
  defaultItemListFilters,
  emptyItemForm,
  formatDateTimeToMinute,
  formatQuantityWithUnit,
  getItemStatusMeta,
  parseItemFormFromView,
  type ItemFormState, type ItemListFilterState,
  type ItemStatusValue
} from "@/lib/inventory/item-view";

export interface TaxonomyOptionView {
  color: null | string;
  icon: null | string;
  id: number;
  name: string;
}

export interface ItemImageView {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: null | string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ItemRecordView {
  createdAt: string;
  id: number;
  notes: null | string;
  operatorId: null | number;
  quantityChange: number;
  type: "ADJUST" | "IN" | "OUT";
  user: null | { displayName: null | string; id: number; username: string };
}

export interface ItemView {
  category: null | TaxonomyOptionView;
  categoryId: null | number;
  createdAt: string;
  description: null | string;
  expiryDate: null | string;
  id: number;
  imageUrl: null | string;
  images: ItemImageView[];
  location: null | TaxonomyOptionView;
  locationId: null | number;
  name: string;
  notes: null | string;
  purchaseDate: null | string;
  purchasePrice: null | number;
  quantity: number;
  records?: ItemRecordView[];
  specification: null | string;
  status: ItemStatusValue;
  unit: null | string;
  updatedAt: string;
}

interface ItemManagerProps {
  categories: TaxonomyOptionView[];
  initialFilters: ItemListFilterState;
  initialItems: ItemView[];
  initialMode?: "camera" | "default" | "photo";
  initialPagination: PaginationView;
  locations: TaxonomyOptionView[];
}

type PanelMode = "create" | "edit" | "view";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CAMERA_AUTO_OPEN_TOKEN = 1;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface ItemManagerState {
  detailLoadingId: null | number;
  error: string;
  form: ItemFormState;
  filters: ItemListFilterState;
  isSubmitting: boolean;
  isListLoading: boolean;
  items: ItemView[];
  listError: string;
  mode: PanelMode;
  pagination: PaginationView;
  selectedItemId: null | number;
  success: string;
}

export function ItemManager({
  categories,
  initialFilters,
  initialItems,
  initialMode = "default",
  initialPagination,
  locations
}: ItemManagerProps) {
  const [state, setState] = useState<ItemManagerState>(() => createInitialState(initialItems, initialFilters, initialPagination));
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const selectedItem = useMemo(() => findSelectedItem(state.items, state.selectedItemId), [state.items, state.selectedItemId]);
  const shouldOpenPhotoRecognition = initialMode === "camera" || initialMode === "photo";

  async function selectItem(item: ItemView) {
    setIsMobilePanelOpen(true);
    setState((current) => ({ ...current, detailLoadingId: item.id, error: "", mode: "view", selectedItemId: item.id }));
    const response = await requestItem(`/api/items/${item.id}`);
    setState((current) => handleDetailResponse(current, item, response));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({ ...current, error: "", isSubmitting: true, success: "" }));
    const response = await saveItem(state.form, state.mode, state.selectedItemId);
    setState((current) => handleSaveResponse(current, response));
  }

  async function deleteSelectedItem() {
    if (!selectedItem || !window.confirm(`删除物品“${selectedItem.name}”？相关出入库记录也会删除。`)) {
      return;
    }

    setState((current) => ({ ...current, error: "", isSubmitting: true, success: "" }));
    const response = await requestItem(`/api/items/${selectedItem.id}`, { method: "DELETE" });
    setState((current) => handleDeleteResponse(current, selectedItem.id, response));
    if (response.ok) {
      setIsMobilePanelOpen(false);
    }
  }

  async function uploadSelectedItemImage(file: File) {
    if (!selectedItem) {
      return { message: "请先选择物品。", ok: false };
    }
    const validation = validateImageBeforeUpload(file);
    if (!validation.ok) {
      return validation;
    }

    setState((current) => ({ ...current, error: "", isSubmitting: true, success: "" }));
    const response = await uploadItemImage(selectedItem.id, file);
    setState((current) => handleImageMutationResponse(current, selectedItem, response, "图片已保存。"));
    return response.ok ? { ok: true } : { message: response.message, ok: false };
  }

  async function deleteSelectedItemImage(imageId: number) {
    if (!selectedItem) {
      return { message: "请先选择物品。", ok: false };
    }

    setState((current) => ({ ...current, error: "", isSubmitting: true, success: "" }));
    const response = await deleteItemImage(selectedItem.id, imageId);
    setState((current) => handleImageMutationResponse(current, selectedItem, response, "图片已删除。"));
    return response.ok ? { ok: true } : { message: response.message, ok: false };
  }

  async function setSelectedItemPrimaryImage(imageId: number) {
    if (!selectedItem) {
      return { message: "请先选择物品。", ok: false };
    }

    setState((current) => ({ ...current, error: "", isSubmitting: true, success: "" }));
    const response = await setPrimaryItemImage(selectedItem.id, imageId);
    setState((current) => handleImageMutationResponse(current, selectedItem, response, "主图已更新。"));
    return response.ok ? { ok: true } : { message: response.message, ok: false };
  }

  async function moveSelectedItemImage(imageId: number, direction: "down" | "up") {
    if (!selectedItem) {
      return { message: "请先选择物品。", ok: false };
    }

    setState((current) => ({ ...current, error: "", isSubmitting: true, success: "" }));
    const response = await moveItemImage(selectedItem.id, imageId, direction);
    setState((current) => handleImageMutationResponse(current, selectedItem, response, "图片顺序已更新。"));
    return response.ok ? { ok: true } : { message: response.message, ok: false };
  }

  async function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadItems(state.filters);
  }

  async function resetFilters() {
    await loadItems(defaultItemListFilters);
  }

  async function changePage(page: number) {
    await loadItems({ ...state.filters, page });
  }

  async function loadItems(filters: ItemListFilterState) {
    setState((current) => ({ ...current, filters, isListLoading: true, listError: "" }));
    const response = await requestItemList(filters);
    updateBrowserQuery(filters);
    setState((current) => handleListResponse(current, filters, response));
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-5">
      <ItemWorkspaceHeader
        itemCount={state.pagination.total}
        onCreate={() => {
          setIsMobilePanelOpen(true);
          setState(startCreate);
        }}
      />
      <TaxonomyNotice categories={categories} locations={locations} />
      <PhotoRecognitionPanel
        autoOpenCameraToken={initialMode === "camera" ? CAMERA_AUTO_OPEN_TOKEN : undefined}
        categories={categories}
        initialExpanded={shouldOpenPhotoRecognition}
        locations={locations}
        onItemCreated={(item) => setState((current) => handleSaveResponse(current, { item: item as ItemView, ok: true }))}
      />
      <OrderParsingPanel
        categories={categories}
        locations={locations}
        onItemCreated={(item) => setState((current) => handleSaveResponse(current, { item: item as ItemView, ok: true }))}
      />
      <ItemListControls
        categories={categories}
        filters={state.filters}
        isLoading={state.isListLoading}
        locations={locations}
        onChange={(filters) => setState((current) => ({ ...current, filters }))}
        onPageChange={changePage}
        onReset={resetFilters}
        onSubmit={submitFilters}
        pagination={state.pagination}
      />
      <Feedback error={state.listError} success="" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ItemList
          isFiltered={hasActiveFilters(state.filters)}
          items={state.items}
          loadingId={state.detailLoadingId}
          onCreate={() => setState(startCreate)}
          onSelect={selectItem}
          selectedItemId={state.selectedItemId}
        />
        <div className="hidden md:block">
          <ItemPanel
            categories={categories}
            error={state.error}
            form={state.form}
            isSubmitting={state.isSubmitting}
            item={selectedItem}
            mode={state.mode}
            onCancel={() => setState(cancelEdit)}
            onChange={(form) => setState((current) => ({ ...current, form }))}
            onDelete={deleteSelectedItem}
            onDeleteImage={deleteSelectedItemImage}
            onEdit={() => selectedItem && setState(startEdit(selectedItem))}
            onMoveImage={moveSelectedItemImage}
            onSetPrimaryImage={setSelectedItemPrimaryImage}
            onSubmit={submitForm}
            onUploadImage={uploadSelectedItemImage}
            success={state.success}
            locations={locations}
          />
        </div>
      </div>
      <MobileItemPanelSheet
        categories={categories}
        error={state.error}
        form={state.form}
        isOpen={isMobilePanelOpen}
        isSubmitting={state.isSubmitting}
        item={selectedItem}
        locations={locations}
        mode={state.mode}
        onCancel={() => setState(cancelEdit)}
        onChange={(form) => setState((current) => ({ ...current, form }))}
        onClose={() => setIsMobilePanelOpen(false)}
        onDelete={deleteSelectedItem}
        onDeleteImage={deleteSelectedItemImage}
        onEdit={() => {
          if (selectedItem) {
            setIsMobilePanelOpen(true);
            setState(startEdit(selectedItem));
          }
        }}
        onMoveImage={moveSelectedItemImage}
        onSetPrimaryImage={setSelectedItemPrimaryImage}
        onSubmit={submitForm}
        onUploadImage={uploadSelectedItemImage}
        success={state.success}
      />
    </section>
  );
}

function createInitialState(
  initialItems: ItemView[],
  initialFilters: ItemListFilterState,
  initialPagination: PaginationView
): ItemManagerState {
  const firstItem = initialItems[0] ?? null;
  return {
    detailLoadingId: null,
    error: "",
    filters: initialFilters,
    form: firstItem ? parseItemFormFromView(firstItem) : emptyItemForm,
    isListLoading: false,
    isSubmitting: false,
    items: initialItems,
    listError: "",
    mode: firstItem ? "view" : "create",
    pagination: initialPagination,
    selectedItemId: firstItem?.id ?? null,
    success: ""
  };
}

function ItemWorkspaceHeader({ itemCount, onCreate }: { itemCount: number; onCreate: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">M2.3 物品管理</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">物品工作区</h1>
      </div>
      <div className="flex items-center gap-2">
        <Tag tone="success">{itemCount} 个物品</Tag>
        <Button leadingIcon={<Plus aria-hidden size={16} />} onClick={onCreate}>
          添加物品
        </Button>
      </div>
    </div>
  );
}

function TaxonomyNotice({ categories, locations }: { categories: TaxonomyOptionView[]; locations: TaxonomyOptionView[] }) {
  if (categories.length > 0 && locations.length > 0) {
    return null;
  }

  const missing = [categories.length === 0 ? "分类" : "", locations.length === 0 ? "位置" : ""].filter(Boolean).join("和");
  return (
    <div className="rounded-card border border-warning/25 bg-[#FFF5E8] px-4 py-3 text-sm text-[#A75B15]">
      还没有可选{missing}。物品仍可先保存为未设置，之后可在分类或位置页面补齐。
    </div>
  );
}

function ItemList({
  isFiltered,
  items,
  loadingId,
  onCreate,
  onSelect,
  selectedItemId
}: {
  isFiltered: boolean;
  items: ItemView[];
  loadingId: null | number;
  onCreate: () => void;
  onSelect: (item: ItemView) => void;
  selectedItemId: null | number;
}) {
  if (items.length === 0) {
    return <ItemEmptyState isFiltered={isFiltered} onCreate={onCreate} />;
  }

  return (
    <div className="min-w-0">
      <MobileItemCards items={items} loadingId={loadingId} onSelect={onSelect} selectedItemId={selectedItemId} />
      <DesktopItemTable items={items} loadingId={loadingId} onSelect={onSelect} selectedItemId={selectedItemId} />
    </div>
  );
}

function ItemEmptyState({ isFiltered, onCreate }: { isFiltered: boolean; onCreate: () => void }) {
  return (
    <Card className="flex min-h-72 flex-col items-start justify-center gap-4">
      <PackagePlus aria-hidden className="text-primary" size={28} />
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{isFiltered ? "没有匹配的物品" : "还没有物品"}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          {isFiltered ? "换一个搜索词或筛选条件，再试一次。" : "先添加第一件家庭库存物品，后续可以继续补充分类、位置、保质期和采购信息。"}
        </p>
      </div>
      {isFiltered ? null : (
        <Button leadingIcon={<Plus aria-hidden size={16} />} onClick={onCreate}>
          添加物品
        </Button>
      )}
    </Card>
  );
}

function MobileItemCards({
  items,
  loadingId,
  onSelect,
  selectedItemId
}: {
  items: ItemView[];
  loadingId: null | number;
  onSelect: (item: ItemView) => void;
  selectedItemId: null | number;
}) {
  return (
    <div className="grid gap-3 md:hidden">
      {items.map((item) => (
        <button
          className={getItemCardClassName(item.id === selectedItemId)}
          key={item.id}
          onClick={() => onSelect(item)}
          type="button"
        >
          <ItemListPrimary item={item} loading={loadingId === item.id} />
          <ItemListMeta item={item} />
          <span className="mt-3 inline-flex text-sm font-medium text-primary">查看详情</span>
        </button>
      ))}
    </div>
  );
}

function DesktopItemTable({
  items,
  loadingId,
  onSelect,
  selectedItemId
}: {
  items: ItemView[];
  loadingId: null | number;
  onSelect: (item: ItemView) => void;
  selectedItemId: null | number;
}) {
  return (
    <div className="hidden overflow-hidden rounded-card border border-soft-border bg-surface md:block">
      <div className="grid grid-cols-[minmax(180px,1.3fr)_90px_120px_120px_108px] border-b border-soft-border px-4 py-3 text-xs font-medium text-text-tertiary">
        <span>物品</span>
        <span>数量</span>
        <span>分类</span>
        <span>位置</span>
        <span>状态</span>
      </div>
      <div className="divide-y divide-soft-border">
        {items.map((item) => (
          <button className={getItemRowClassName(item.id === selectedItemId)} key={item.id} onClick={() => onSelect(item)} type="button">
            <ItemListPrimary item={item} loading={loadingId === item.id} />
        <span className="text-sm font-semibold text-text-primary">{formatQuantityWithUnit(item.quantity, item.unit)}</span>
            <TaxonomyPill item={item.category} fallback="未分类" />
            <TaxonomyPill item={item.location} fallback="未设置" />
            <StatusTag status={item.status} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemListPrimary({ item, loading }: { item: ItemView; loading: boolean }) {
  const primaryImage = item.images.find((img) => img.isPrimary) ?? item.images[0];
  const imageSrc = primaryImage?.thumbnailUrl || primaryImage?.url || item.imageUrl;

  return (
    <span className="flex min-w-0 items-start gap-3">
      {imageSrc ? (
        <img
          alt={item.name}
          className="size-12 shrink-0 rounded-card object-cover"
          src={imageSrc}
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-surface-secondary">
          <ImageIcon aria-hidden className="text-text-tertiary" size={20} />
        </span>
      )}
      <span className="min-w-0 text-left">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-semibold text-text-primary md:text-sm">{item.name}</span>
          {loading ? <RefreshCw aria-hidden className="animate-spin text-primary" size={14} /> : null}
        </span>
        <span className="mt-1 block truncate text-xs text-text-tertiary">{getItemSubtitle(item)}</span>
      </span>
    </span>
  );
}

function ItemListMeta({ item }: { item: ItemView }) {
  return (
    <span className="mt-3 flex flex-wrap items-center gap-2">
      <Tag>{formatQuantityWithUnit(item.quantity, item.unit)}</Tag>
      {item.specification ? <Tag>{item.specification}</Tag> : null}
      <TaxonomyPill item={item.category} fallback="未分类" />
      <TaxonomyPill item={item.location} fallback="未设置" />
      <StatusTag status={item.status} />
    </span>
  );
}

function ItemPanel(props: {
  categories: TaxonomyOptionView[];
  error: string;
  form: ItemFormState;
  isSubmitting: boolean;
  item: ItemView | null;
  locations: TaxonomyOptionView[];
  mode: PanelMode;
  onCancel: () => void;
  onChange: (form: ItemFormState) => void;
  onDelete: () => void;
  onDeleteImage: (imageId: number) => Promise<{ message?: string; ok: boolean }>;
  onEdit: () => void;
  onMoveImage: (imageId: number, direction: "down" | "up") => Promise<{ message?: string; ok: boolean }>;
  onSetPrimaryImage: (imageId: number) => Promise<{ message?: string; ok: boolean }>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUploadImage: (file: File) => Promise<{ message?: string; ok: boolean }>;
  success: string;
}) {
  if (props.mode === "view" && props.item) {
    return <ItemDetailPanel {...props} item={props.item} />;
  }

  return <ItemFormPanel {...props} />;
}

function MobileItemPanelSheet({
  isOpen,
  onClose,
  ...panelProps
}: Parameters<typeof ItemPanel>[0] & {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div
      aria-hidden={!isOpen}
      className={[
        "fixed inset-0 z-40 md:hidden",
        isOpen ? "pointer-events-auto" : "pointer-events-none hidden"
      ].join(" ")}
    >
      <button
        aria-label="关闭详情"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        type="button"
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[16px] bg-app-background p-4 shadow-[0_-16px_36px_rgba(51,51,51,0.18)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">移动端物品详情</h2>
          <button
            className="min-h-10 rounded-card px-3 text-sm font-medium text-primary transition hover:bg-primary-light"
            onClick={onClose}
            type="button"
          >
            关闭详情
          </button>
        </div>
        {isOpen ? <ItemPanel {...panelProps} /> : null}
      </section>
    </div>
  );
}

function ItemFormPanel({
  categories,
  error,
  form,
  isSubmitting,
  locations,
  mode,
  onCancel,
  onChange,
  onSubmit,
  success
}: Parameters<typeof ItemPanel>[0]) {
  return (
    <Card className="xl:sticky xl:top-6">
      <CardHeader>
        <CardTitle>{mode === "edit" ? "编辑物品" : "添加物品"}</CardTitle>
        <CardDescription>名称和数量必填，其余字段可在之后补充。</CardDescription>
      </CardHeader>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <ItemFormFields categories={categories} form={form} locations={locations} onChange={onChange} />
        <Feedback error={error} success={success} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={isSubmitting} leadingIcon={<CheckCircle2 aria-hidden size={16} />} type="submit">
            {isSubmitting ? "保存中" : mode === "edit" ? "保存修改" : "创建物品"}
          </Button>
          {mode === "edit" ? (
            <Button leadingIcon={<X aria-hidden size={16} />} onClick={onCancel} variant="ghost">
              取消编辑
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function ItemFormFields({
  categories,
  form,
  locations,
  onChange
}: {
  categories: TaxonomyOptionView[];
  form: ItemFormState;
  locations: TaxonomyOptionView[];
  onChange: (form: ItemFormState) => void;
}) {
  return (
    <>
      <Input label="名称" name="name" onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="例如：牛奶" value={form.name} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.55fr)]">
        <Input label="数量" min={1} name="quantity" onChange={(event) => onChange({ ...form, quantity: event.target.value })} type="number" value={form.quantity} />
        <Input label="数量单位" name="unit" onChange={(event) => onChange({ ...form, unit: event.target.value })} placeholder="例如：桶、箱、瓶" value={form.unit} />
      </div>
      <Input label="规格" name="specification" onChange={(event) => onChange({ ...form, specification: event.target.value })} placeholder="例如：500ML、3L、12瓶/箱" value={form.specification} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="分类" name="categoryId" onChange={(value) => onChange({ ...form, categoryId: value })} options={categories} placeholder="未分类" value={form.categoryId} />
        <SelectField label="位置" name="locationId" onChange={(value) => onChange({ ...form, locationId: value })} options={locations} placeholder="未设置" value={form.locationId} />
      </div>
      <TextareaField label="描述" name="description" onChange={(value) => onChange({ ...form, description: value })} placeholder="补充规格、口味或用途" value={form.description} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ExpiryDateField name="expiryDate" onChange={(value) => onChange({ ...form, expiryDate: value })} value={form.expiryDate} />
        <Input label="采购日期" name="purchaseDate" onChange={(event) => onChange({ ...form, purchaseDate: event.target.value })} type="date" value={form.purchaseDate} />
      </div>
      <Input label="采购价格" min={0} name="purchasePrice" onChange={(event) => onChange({ ...form, purchasePrice: event.target.value })} placeholder="例如：18.9" step="0.01" type="number" value={form.purchasePrice} />
      <TextareaField label="备注" name="notes" onChange={(value) => onChange({ ...form, notes: value })} placeholder="例如：先用这批" value={form.notes} />
    </>
  );
}

function ItemDetailPanel({
  error,
  isSubmitting,
  item,
  onDelete,
  onDeleteImage,
  onEdit,
  onMoveImage,
  onSetPrimaryImage,
  onUploadImage,
  success
}: Parameters<typeof ItemPanel>[0] & { item: ItemView }) {
  const primaryImage = item.images.find((img) => img.isPrimary) ?? item.images[0];
  const imageSrc = primaryImage?.url || item.imageUrl;

  return (
    <Card className="xl:sticky xl:top-6">
      {imageSrc ? (
        <img
          alt={item.name}
          className="mb-4 max-h-64 w-full rounded-card object-contain"
          src={imageSrc}
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-text-primary">{item.name}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description || "暂无描述。"}</p>
        </div>
        <StatusTag status={item.status} />
      </div>
      <ItemDetailGrid item={item} />
      <ItemImageManager
        images={item.images}
        isBusy={isSubmitting}
        itemName={item.name}
        onDelete={onDeleteImage}
        onMove={onMoveImage}
        onSetPrimary={onSetPrimaryImage}
        onUpload={onUploadImage}
      />
      <RecordList records={item.records ?? []} />
      <Feedback error={error} success={success} />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button leadingIcon={<Pencil aria-hidden size={16} />} onClick={onEdit} variant="secondary">
          编辑
        </Button>
        <Button disabled={isSubmitting} leadingIcon={<Trash2 aria-hidden size={16} />} onClick={onDelete} variant="danger">
          {isSubmitting ? "删除中" : "删除"}
        </Button>
      </div>
    </Card>
  );
}

function ItemDetailGrid({ item }: { item: ItemView }) {
  const details = [
    ["数量单位", formatQuantityWithUnit(item.quantity, item.unit)],
    ["规格", item.specification || "未记录"],
    ["分类", item.category?.name ?? "未分类"],
    ["位置", item.location?.name ?? "未设置"],
    ["保质期", formatDisplayDate(item.expiryDate)],
    ["采购日期", formatDisplayDate(item.purchaseDate)],
    ["采购价格", item.purchasePrice === null ? "未记录" : `¥${item.purchasePrice.toFixed(2)}`],
    ["更新时间", formatDisplayDate(item.updatedAt)],
    ["备注", item.notes || "暂无备注"]
  ];

  return (
    <dl className="mt-5 grid grid-cols-2 gap-3">
      {details.map(([label, value]) => (
        <div className="rounded-card border border-soft-border px-3 py-2" key={label}>
          <dt className="text-xs text-text-tertiary">{label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordList({ records }: { records: ItemRecordView[] }) {
  return (
    <div className="mt-5 border-t border-soft-border pt-4">
      <h3 className="text-sm font-semibold text-text-primary">最近记录</h3>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">暂无出入库记录。</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {records.slice(0, 3).map((record) => (
            <li className="flex items-center justify-between rounded-card bg-primary-light px-3 py-2 text-sm" key={record.id}>
              <span className="font-medium text-primary">{getRecordLabel(record)}</span>
              <span className="text-text-secondary">{formatDateTimeToMinute(record.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  onChange,
  options,
  placeholder,
  value
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: TaxonomyOptionView[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor={name}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <select className="min-h-11 rounded-card border border-soft-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light" id={name} name={name} onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  onChange,
  placeholder,
  value
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor={name}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <textarea className="min-h-24 rounded-card border border-soft-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light" id={name} name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function StatusTag({ status }: { status: ItemStatusValue }) {
  const meta = getItemStatusMeta(status);
  return <Tag tone={meta.tone}>{meta.label}</Tag>;
}

function TaxonomyPill({ fallback, item }: { fallback: string; item: null | TaxonomyOptionView }) {
  return (
    <Tag>
      {item?.color ? <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} /> : null}
      {item?.name ?? fallback}
    </Tag>
  );
}

function Feedback({ error, success }: { error: string; success: string }) {
  if (error) {
    return <p className="mt-4 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>;
  }

  if (success) {
    return <p className="mt-4 rounded-card bg-primary-light px-3 py-2 text-sm text-primary">{success}</p>;
  }

  return null;
}

function startCreate(current: ItemManagerState): ItemManagerState {
  return { ...current, error: "", form: emptyItemForm, mode: "create", selectedItemId: null, success: "" };
}

function startEdit(item: ItemView) {
  return (current: ItemManagerState): ItemManagerState => ({
    ...current,
    error: "",
    form: parseItemFormFromView(item),
    mode: "edit",
    selectedItemId: item.id,
    success: ""
  });
}

function cancelEdit(current: ItemManagerState): ItemManagerState {
  const selectedItem = findSelectedItem(current.items, current.selectedItemId);
  return {
    ...current,
    error: "",
    form: selectedItem ? parseItemFormFromView(selectedItem) : emptyItemForm,
    mode: selectedItem ? "view" : "create",
    success: ""
  };
}

function findSelectedItem(items: ItemView[], selectedItemId: null | number) {
  return items.find((item) => item.id === selectedItemId) ?? null;
}

async function saveItem(form: ItemFormState, mode: PanelMode, selectedItemId: null | number) {
  const isEditing = mode === "edit" && selectedItemId !== null;
  return requestItem(isEditing ? `/api/items/${selectedItemId}` : "/api/items", {
    body: JSON.stringify(buildItemPayload(form)),
    method: isEditing ? "PUT" : "POST"
  });
}

function validateImageBeforeUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { message: "只支持 JPG、PNG、WebP 格式的图片。", ok: false as const };
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return { message: "图片大小不能超过 10MB。", ok: false as const };
  }

  return { ok: true as const };
}

async function uploadItemImage(itemId: number, file: File) {
  const formData = new FormData();
  formData.set("file", file);
  let response: Response;
  try {
    response = await fetch(`/api/items/${itemId}/images`, {
      body: formData,
      method: "POST"
    });
  } catch {
    return { message: "网络异常，图片保存失败，请稍后重试。", ok: false as const };
  }
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return parseImageMutationResponse(response, payload, "图片保存失败，请稍后重试。");
}

async function deleteItemImage(itemId: number, imageId: number) {
  let response: Response;
  try {
    response = await fetch(`/api/items/${itemId}/images/${imageId}`, { method: "DELETE" });
  } catch {
    return { message: "网络异常，图片删除失败，请稍后重试。", ok: false as const };
  }
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return parseImageMutationResponse(response, payload, "图片删除失败，请稍后重试。");
}

async function setPrimaryItemImage(itemId: number, imageId: number) {
  let response: Response;
  try {
    response = await fetch(`/api/items/${itemId}/images/${imageId}`, {
      body: JSON.stringify({ action: "setPrimary" }),
      headers: { "Content-Type": "application/json" },
      method: "PUT"
    });
  } catch {
    return { message: "网络异常，主图设置失败，请稍后重试。", ok: false as const };
  }
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return parseImageMutationResponse(response, payload, "主图设置失败，请稍后重试。");
}

async function moveItemImage(itemId: number, imageId: number, direction: "down" | "up") {
  let response: Response;
  try {
    response = await fetch(`/api/items/${itemId}/images/${imageId}`, {
      body: JSON.stringify({ action: "move", direction }),
      headers: { "Content-Type": "application/json" },
      method: "PUT"
    });
  } catch {
    return { message: "网络异常，图片排序失败，请稍后重试。", ok: false as const };
  }
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return parseImageMutationResponse(response, payload, "图片排序失败，请稍后重试。");
}

function parseImageMutationResponse(response: Response, payload: null | { data?: { item?: ItemView }; message?: string }, fallbackMessage: string) {
  if (!response.ok || !payload?.data?.item) {
    return { message: payload?.message ?? fallbackMessage, ok: false as const };
  }

  return { item: payload.data.item, ok: true as const };
}

async function requestItemList(filters: ItemListFilterState) {
  const params = buildItemListSearchParams(filters);
  const path = params.size > 0 ? `/api/items?${params.toString()}` : "/api/items";
  let response: Response;
  try {
    response = await fetch(path, { headers: { "Content-Type": "application/json" } });
  } catch {
    return { message: "网络异常，物品列表加载失败，请稍后重试。", ok: false as const };
  }
  const payload = (await response.json().catch(() => null)) as ItemListApiResponse;

  if (!response.ok || !payload || payload.code !== 0 || !payload.data) {
    return { message: payload?.message ?? "物品列表加载失败，请稍后重试。", ok: false as const };
  }

  return { items: payload.data.items, ok: true as const, pagination: payload.data.pagination };
}

async function requestItem(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
  } catch {
    return { message: "网络异常，操作失败，请稍后重试。", ok: false as const };
  }
  const payload = (await response.json().catch(() => null)) as ItemApiResponse;

  if (!response.ok || !payload || payload.code !== 0 || !payload.data?.item) {
    return { message: payload?.message ?? "操作失败，请稍后重试。", ok: false as const };
  }

  return { item: payload.data.item, ok: true as const };
}

function handleDetailResponse(current: ItemManagerState, fallback: ItemView, response: Awaited<ReturnType<typeof requestItem>>) {
  if (!response.ok) {
    return { ...current, detailLoadingId: null, error: response.message };
  }

  return { ...current, detailLoadingId: null, form: parseItemFormFromView(response.item), items: upsertItem(current.items, response.item), selectedItemId: fallback.id };
}

function handleListResponse(
  current: ItemManagerState,
  filters: ItemListFilterState,
  response: Awaited<ReturnType<typeof requestItemList>>
): ItemManagerState {
  if (!response.ok) {
    return { ...current, filters, isListLoading: false, listError: response.message };
  }

  const nextSelected = response.items.find((item) => item.id === current.selectedItemId) ?? response.items[0] ?? null;
  return {
    ...current,
    filters,
    form: nextSelected ? parseItemFormFromView(nextSelected) : emptyItemForm,
    isListLoading: false,
    items: response.items,
    listError: "",
    mode: nextSelected ? "view" : "create",
    pagination: response.pagination,
    selectedItemId: nextSelected?.id ?? null
  };
}

function handleSaveResponse(current: ItemManagerState, response: Awaited<ReturnType<typeof requestItem>>): ItemManagerState {
  if (!response.ok) {
    return { ...current, error: response.message, isSubmitting: false };
  }

  return {
    ...current,
    form: parseItemFormFromView(response.item),
    isSubmitting: false,
    items: upsertItem(current.items, response.item),
    mode: "view",
    selectedItemId: response.item.id,
    success: "物品已保存。"
  };
}

function handleDeleteResponse(
  current: ItemManagerState,
  id: number,
  response: Awaited<ReturnType<typeof requestItem>>
): ItemManagerState {
  if (!response.ok) {
    return { ...current, error: response.message, isSubmitting: false };
  }

  const nextItems = current.items.filter((item) => item.id !== id);
  const nextSelected = nextItems[0] ?? null;
  return {
    ...current,
    form: nextSelected ? parseItemFormFromView(nextSelected) : emptyItemForm,
    isSubmitting: false,
    items: nextItems,
    mode: nextSelected ? "view" : "create",
    selectedItemId: nextSelected?.id ?? null,
    success: "物品已删除。"
  };
}

function handleImageMutationResponse(
  current: ItemManagerState,
  fallback: ItemView,
  response: Awaited<ReturnType<typeof requestItem>>,
  success: string
): ItemManagerState {
  if (!response.ok) {
    return { ...current, error: response.message, isSubmitting: false };
  }

  return {
    ...current,
    form: parseItemFormFromView(response.item),
    isSubmitting: false,
    items: upsertItem(current.items, response.item),
    mode: "view",
    selectedItemId: fallback.id,
    success
  };
}

function upsertItem(items: ItemView[], item: ItemView) {
  const nextItems = items.some((currentItem) => currentItem.id === item.id)
    ? items.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
    : [item, ...items];

  return nextItems.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function getItemCardClassName(isActive: boolean) {
  return [
    "min-h-28 rounded-card border bg-surface p-4 text-left shadow-sm transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isActive ? "border-primary" : "border-soft-border hover:border-primary/50"
  ].join(" ");
}

function getItemRowClassName(isActive: boolean) {
  return [
    "grid w-full grid-cols-[minmax(180px,1.3fr)_90px_120px_120px_108px] items-center gap-2 px-4 py-3 text-left transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isActive ? "bg-primary-light" : "hover:bg-app-background"
  ].join(" ");
}

function formatDisplayDate(value: null | string) {
  return value ? value.slice(0, 10) : "未记录";
}

function getItemSubtitle(item: Pick<ItemView, "description" | "specification">) {
  if (item.description && item.specification) {
    return `${item.specification} · ${item.description}`;
  }

  return item.description || item.specification || "暂无描述";
}

function getRecordLabel(record: ItemRecordView) {
  const typeLabel = record.type === "IN" ? "入库" : record.type === "OUT" ? "出库" : "调整";
  return `${typeLabel} ${record.quantityChange > 0 ? "+" : ""}${record.quantityChange}`;
}

function updateBrowserQuery(filters: ItemListFilterState) {
  if (typeof window === "undefined") {
    return;
  }

  const params = buildItemListSearchParams(filters);
  const query = params.toString();
  window.history.replaceState(null, "", query ? `/items?${query}` : "/items");
}

function hasActiveFilters(filters: ItemListFilterState) {
  return buildItemListSearchParams({ ...filters, page: 1 }).size > 0;
}

interface ItemListApiResponse {
  code: number;
  data?: { items: ItemView[]; pagination: PaginationView };
  message: string;
}

interface ItemApiResponse {
  code: number;
  data?: { item: ItemView };
  message: string;
}
