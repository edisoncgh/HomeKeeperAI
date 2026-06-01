"use client";

import { FormEvent } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button, Input, Tag } from "@/components/ui";
import type { ItemListFilterState, ItemSortField, ItemStatusValue } from "@/lib/inventory/item-view";

interface TaxonomyOption {
  id: number;
  name: string;
}

export interface PaginationView {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

interface ItemListControlsProps {
  categories: TaxonomyOption[];
  filters: ItemListFilterState;
  isLoading: boolean;
  locations: TaxonomyOption[];
  onChange: (filters: ItemListFilterState) => void;
  onPageChange: (page: number) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pagination: PaginationView;
}

const statusOptions: Array<{ label: string; value: "" | ItemStatusValue }> = [
  { label: "全部状态", value: "" },
  { label: "正常", value: "NORMAL" },
  { label: "临期", value: "EXPIRING" },
  { label: "已过期", value: "EXPIRED" },
  { label: "库存低", value: "LOW_STOCK" }
];

const sortOptions: Array<{ label: string; value: ItemSortField }> = [
  { label: "最近更新", value: "updatedAt" },
  { label: "创建时间", value: "createdAt" },
  { label: "名称", value: "name" },
  { label: "数量", value: "quantity" },
  { label: "保质期", value: "expiryDate" }
];

export function ItemListControls({
  categories,
  filters,
  isLoading,
  locations,
  onChange,
  onPageChange,
  onReset,
  onSubmit,
  pagination
}: ItemListControlsProps) {
  return (
    <div className="rounded-card border border-soft-border bg-surface p-4 shadow-sm">
      <form className="grid gap-3 xl:grid-cols-[minmax(180px,1.2fr)_160px_160px_140px_140px_120px_auto]" onSubmit={onSubmit}>
        <Input
          label="搜索"
          leadingIcon={<Search aria-hidden size={16} />}
          name="q"
          onChange={(event) => onChange({ ...filters, page: 1, q: event.target.value })}
          placeholder="名称、描述、备注"
          value={filters.q}
        />
        <SelectField
          label="分类"
          name="category-filter"
          onChange={(value) => onChange({ ...filters, categoryId: value, page: 1 })}
          options={categories}
          placeholder="全部分类"
          value={filters.categoryId}
        />
        <SelectField
          label="位置"
          name="location-filter"
          onChange={(value) => onChange({ ...filters, locationId: value, page: 1 })}
          options={locations}
          placeholder="全部位置"
          value={filters.locationId}
        />
        <StatusSelect filters={filters} onChange={onChange} />
        <SortSelect filters={filters} onChange={onChange} />
        <OrderSelect filters={filters} onChange={onChange} />
        <div className="flex items-end gap-2">
          <Button disabled={isLoading} leadingIcon={<Filter aria-hidden size={16} />} type="submit">
            {isLoading ? "查询中" : "查询"}
          </Button>
          <Button aria-label="重置筛选" disabled={isLoading} onClick={onReset} size="icon" variant="ghost">
            <RotateCcw aria-hidden size={16} />
          </Button>
        </div>
      </form>
      <div className="mt-4 flex flex-col gap-3 border-t border-soft-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Tag tone="neutral">
          共 {pagination.total} 条，当前第 {pagination.page} / {Math.max(pagination.pageCount, 1)} 页
        </Tag>
        <div className="flex gap-2">
          <Button
            disabled={isLoading || pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            variant="secondary"
          >
            上一页
          </Button>
          <Button
            disabled={isLoading || pagination.page >= pagination.pageCount}
            onClick={() => onPageChange(pagination.page + 1)}
            variant="secondary"
          >
            下一页
          </Button>
        </div>
      </div>
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
  options: TaxonomyOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor={name}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <select className={selectClassName} id={name} name={name} onChange={(event) => onChange(event.target.value)} value={value}>
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

function StatusSelect({
  filters,
  onChange
}: {
  filters: ItemListFilterState;
  onChange: (filters: ItemListFilterState) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor="status-filter">
      <span className="text-sm font-medium text-text-primary">状态</span>
      <select
        className={selectClassName}
        id="status-filter"
        name="status"
        onChange={(event) => onChange({ ...filters, page: 1, status: event.target.value as ItemListFilterState["status"] })}
        value={filters.status}
      >
        {statusOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortSelect({
  filters,
  onChange
}: {
  filters: ItemListFilterState;
  onChange: (filters: ItemListFilterState) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor="sort-filter">
      <span className="text-sm font-medium text-text-primary">排序</span>
      <select
        className={selectClassName}
        id="sort-filter"
        name="sort"
        onChange={(event) => onChange({ ...filters, page: 1, sort: event.target.value as ItemSortField })}
        value={filters.sort}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrderSelect({
  filters,
  onChange
}: {
  filters: ItemListFilterState;
  onChange: (filters: ItemListFilterState) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor="order-filter">
      <span className="text-sm font-medium text-text-primary">方向</span>
      <select
        className={selectClassName}
        id="order-filter"
        name="order"
        onChange={(event) => onChange({ ...filters, page: 1, order: event.target.value === "asc" ? "asc" : "desc" })}
        value={filters.order}
      >
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>
    </label>
  );
}

const selectClassName =
  "min-h-11 rounded-card border border-soft-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light";
