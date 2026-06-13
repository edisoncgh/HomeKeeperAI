"use client";

import { FormEvent, useEffect, useState } from "react";
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(hasActiveFilters(filters));
  const activeSummaries = buildFilterSummaries(filters, categories, locations);

  useEffect(() => {
    if (!hasActiveFilters(filters)) {
      setIsMobileFiltersOpen(false);
    }
  }, [filters]);

  return (
    <div className="rounded-card border border-soft-border bg-surface p-4 shadow-sm">
      <div className="md:hidden">
        <MobileFilterControls
          activeSummaries={activeSummaries}
          categories={categories}
          filters={filters}
          isLoading={isLoading}
          isOpen={isMobileFiltersOpen}
          locations={locations}
          onChange={onChange}
          onReset={onReset}
          onSubmit={onSubmit}
          setIsOpen={setIsMobileFiltersOpen}
        />
      </div>
      <div className="hidden md:block">
        <DesktopFilterForm
          categories={categories}
          filters={filters}
          isLoading={isLoading}
          locations={locations}
          onChange={onChange}
          onReset={onReset}
          onSubmit={onSubmit}
        />
      </div>
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

function MobileFilterControls({
  activeSummaries,
  categories,
  filters,
  isLoading,
  isOpen,
  locations,
  onChange,
  onReset,
  onSubmit,
  setIsOpen
}: {
  activeSummaries: string[];
  categories: TaxonomyOption[];
  filters: ItemListFilterState;
  isLoading: boolean;
  isOpen: boolean;
  locations: TaxonomyOption[];
  onChange: (filters: ItemListFilterState) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <span className="sr-only">筛选条件</span>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="搜索"
            leadingIcon={<Search aria-hidden size={16} />}
            name="q"
            onChange={(event) => onChange({ ...filters, page: 1, q: event.target.value })}
            placeholder="名称、描述、备注"
            value={filters.q}
          />
        </div>
        <Button
          aria-expanded={isOpen}
          disabled={isLoading}
          leadingIcon={<Filter aria-hidden size={16} />}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          variant="secondary"
        >
          {isOpen ? "收起筛选" : "展开筛选"}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-tertiary">当前筛选</span>
        {(activeSummaries.length > 0 ? activeSummaries : ["全部物品"]).map((summary) => (
          <Tag key={summary} tone="neutral">
            {summary}
          </Tag>
        ))}
      </div>
      {isOpen ? (
        <div className="grid gap-3 rounded-card border border-soft-border bg-surface-secondary p-3">
          <p className="text-sm font-semibold text-text-primary">筛选条件</p>
          <SelectField
            label="分类"
            name="category-filter-mobile"
            onChange={(value) => onChange({ ...filters, categoryId: value, page: 1 })}
            options={categories}
            placeholder="全部分类"
            value={filters.categoryId}
          />
          <SelectField
            label="位置"
            name="location-filter-mobile"
            onChange={(value) => onChange({ ...filters, locationId: value, page: 1 })}
            options={locations}
            placeholder="全部位置"
            value={filters.locationId}
          />
          <StatusSelect filters={filters} id="status-filter-mobile" onChange={onChange} />
          <SortSelect filters={filters} id="sort-filter-mobile" onChange={onChange} />
          <OrderSelect filters={filters} id="order-filter-mobile" onChange={onChange} />
          <div className="flex gap-2">
            <Button disabled={isLoading} leadingIcon={<Filter aria-hidden size={16} />} type="submit">
              {isLoading ? "查询中" : "查询"}
            </Button>
            <Button aria-label="重置筛选" disabled={isLoading} onClick={onReset} size="icon" variant="ghost">
              <RotateCcw aria-hidden size={16} />
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function DesktopFilterForm({
  categories,
  filters,
  isLoading,
  locations,
  onChange,
  onReset,
  onSubmit
}: {
  categories: TaxonomyOption[];
  filters: ItemListFilterState;
  isLoading: boolean;
  locations: TaxonomyOption[];
  onChange: (filters: ItemListFilterState) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
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
      <StatusSelect filters={filters} id="status-filter" onChange={onChange} />
      <SortSelect filters={filters} id="sort-filter" onChange={onChange} />
      <OrderSelect filters={filters} id="order-filter" onChange={onChange} />
      <div className="flex items-end gap-2">
        <Button disabled={isLoading} leadingIcon={<Filter aria-hidden size={16} />} type="submit">
          {isLoading ? "查询中" : "查询"}
        </Button>
        <Button aria-label="重置筛选" disabled={isLoading} onClick={onReset} size="icon" variant="ghost">
          <RotateCcw aria-hidden size={16} />
        </Button>
      </div>
    </form>
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
  id,
  onChange
}: {
  filters: ItemListFilterState;
  id: string;
  onChange: (filters: ItemListFilterState) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-text-primary">状态</span>
      <select
        className={selectClassName}
        id={id}
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
  id,
  onChange
}: {
  filters: ItemListFilterState;
  id: string;
  onChange: (filters: ItemListFilterState) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-text-primary">排序</span>
      <select
        className={selectClassName}
        id={id}
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
  id,
  onChange
}: {
  filters: ItemListFilterState;
  id: string;
  onChange: (filters: ItemListFilterState) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-text-primary">方向</span>
      <select
        className={selectClassName}
        id={id}
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

function hasActiveFilters(filters: ItemListFilterState) {
  return Boolean(filters.q || filters.categoryId || filters.locationId || filters.status || filters.sort !== "updatedAt" || filters.order !== "desc");
}

function buildFilterSummaries(filters: ItemListFilterState, categories: TaxonomyOption[], locations: TaxonomyOption[]) {
  const summaries: string[] = [];
  if (filters.q) {
    summaries.push(`搜索: ${filters.q}`);
  }
  const category = categories.find((item) => String(item.id) === filters.categoryId);
  if (category) {
    summaries.push(`分类: ${category.name}`);
  }
  const location = locations.find((item) => String(item.id) === filters.locationId);
  if (location) {
    summaries.push(`位置: ${location.name}`);
  }
  const status = statusOptions.find((item) => item.value === filters.status);
  if (status && status.value) {
    summaries.push(`状态: ${status.label}`);
  }
  if (filters.sort !== "updatedAt") {
    summaries.push(`排序: ${sortOptions.find((item) => item.value === filters.sort)?.label ?? filters.sort}`);
  }
  if (filters.order !== "desc") {
    summaries.push("升序");
  }

  return summaries;
}
