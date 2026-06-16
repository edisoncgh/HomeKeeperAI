export type ItemStatusValue = "EXPIRED" | "EXPIRING" | "LOW_STOCK" | "NORMAL";
export type ItemSortField = "createdAt" | "expiryDate" | "name" | "quantity" | "updatedAt";
type TagTone = "danger" | "neutral" | "success" | "warning";

export interface ItemListFilterState {
  categoryId: string;
  locationId: string;
  order: "asc" | "desc";
  page: number;
  pageSize: number;
  q: string;
  sort: ItemSortField;
  status: "" | ItemStatusValue;
}

export interface ItemFormState {
  categoryId: string;
  description: string;
  expiryDate: string;
  imageUrl: string;
  locationId: string;
  name: string;
  notes: string;
  purchaseDate: string;
  purchasePrice: string;
  quantity: string;
  specification: string;
  unit: string;
}

export const emptyItemForm: ItemFormState = {
  categoryId: "",
  description: "",
  expiryDate: "",
  imageUrl: "",
  locationId: "",
  name: "",
  notes: "",
  purchaseDate: "",
  purchasePrice: "",
  quantity: "1",
  specification: "",
  unit: ""
};

export const defaultItemListFilters: ItemListFilterState = {
  categoryId: "",
  locationId: "",
  order: "desc",
  page: 1,
  pageSize: 20,
  q: "",
  sort: "updatedAt",
  status: ""
};

const statusMeta: Record<ItemStatusValue, { label: string; tone: TagTone }> = {
  EXPIRED: { label: "已过期", tone: "danger" },
  EXPIRING: { label: "临期", tone: "warning" },
  LOW_STOCK: { label: "库存低", tone: "warning" },
  NORMAL: { label: "正常", tone: "success" }
};

const itemStatuses = new Set(["EXPIRED", "EXPIRING", "LOW_STOCK", "NORMAL"]);
const itemSortFields = new Set(["createdAt", "expiryDate", "name", "quantity", "updatedAt"]);

export function buildItemPayload(form: ItemFormState) {
  return {
    categoryId: parseOptionalNumber(form.categoryId),
    description: normalizeOptionalString(form.description),
    expiryDate: normalizeOptionalString(form.expiryDate),
    imageUrl: normalizeOptionalString(form.imageUrl),
    locationId: parseOptionalNumber(form.locationId),
    name: form.name.trim(),
    notes: normalizeOptionalString(form.notes),
    purchaseDate: normalizeOptionalString(form.purchaseDate),
    purchasePrice: parseOptionalNumber(form.purchasePrice),
    quantity: Number(form.quantity),
    specification: normalizeOptionalString(form.specification),
    unit: normalizeOptionalString(form.unit)
  };
}

export function buildItemListSearchParams(filters: ItemListFilterState) {
  const params = new URLSearchParams();
  const q = filters.q.trim();

  appendQueryValue(params, "q", q);
  appendQueryValue(params, "categoryId", filters.categoryId);
  appendQueryValue(params, "locationId", filters.locationId);
  appendQueryValue(params, "status", filters.status);
  appendDefaultedValue(params, "sort", filters.sort, defaultItemListFilters.sort);
  appendDefaultedValue(params, "order", filters.order, defaultItemListFilters.order);
  appendDefaultedValue(params, "page", String(filters.page), String(defaultItemListFilters.page));
  appendDefaultedValue(params, "pageSize", String(filters.pageSize), String(defaultItemListFilters.pageSize));

  return params;
}

export function parseItemListFilters(searchParams: URLSearchParams): ItemListFilterState {
  return {
    categoryId: parsePositiveIntegerString(searchParams.get("categoryId")),
    locationId: parsePositiveIntegerString(searchParams.get("locationId")),
    order: searchParams.get("order") === "asc" ? "asc" : "desc",
    page: parsePositiveInteger(searchParams.get("page"), defaultItemListFilters.page, 100000),
    pageSize: parsePositiveInteger(searchParams.get("pageSize"), defaultItemListFilters.pageSize, 100),
    q: (searchParams.get("q") ?? "").trim(),
    sort: parseSortField(searchParams.get("sort")),
    status: parseStatusValue(searchParams.get("status"))
  };
}

export function formatDateForInput(value: null | string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function formatDateTimeToMinute(value: null | string) {
  return value ? value.slice(0, 16).replace("T", " ") : "未记录";
}

export function getItemStatusMeta(status: ItemStatusValue) {
  return statusMeta[status];
}

export function parseItemFormFromView(item: {
  categoryId: null | number;
  description: null | string;
  expiryDate: null | string;
  imageUrl: null | string;
  locationId: null | number;
  name: string;
  notes: null | string;
  purchaseDate: null | string;
  purchasePrice: null | number;
  quantity: number;
  specification: null | string;
  unit: null | string;
}): ItemFormState {
  return {
    categoryId: item.categoryId ? String(item.categoryId) : "",
    description: item.description ?? "",
    expiryDate: formatDateForInput(item.expiryDate),
    imageUrl: item.imageUrl ?? "",
    locationId: item.locationId ? String(item.locationId) : "",
    name: item.name,
    notes: item.notes ?? "",
    purchaseDate: formatDateForInput(item.purchaseDate),
    purchasePrice: item.purchasePrice === null ? "" : String(item.purchasePrice),
    quantity: String(item.quantity),
    specification: item.specification ?? "",
    unit: item.unit ?? ""
  };
}

export function formatQuantityWithUnit(quantity: number, unit: null | string) {
  const normalized = unit?.trim();
  return `${quantity} ${normalized || "件"}`;
}

function normalizeOptionalString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : null;
}

function appendQueryValue(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  }
}

function appendDefaultedValue(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value !== defaultValue) {
    params.set(key, value);
  }
}

function parsePositiveIntegerString(value: null | string) {
  const normalized = (value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? normalized : "";
}

function parsePositiveInteger(value: null | string, fallback: number, max: number) {
  const parsed = Number((value ?? "").trim());
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
}

function parseSortField(value: null | string) {
  const normalized = (value ?? "").trim();
  return itemSortFields.has(normalized) ? (normalized as ItemSortField) : defaultItemListFilters.sort;
}

function parseStatusValue(value: null | string) {
  const normalized = (value ?? "").trim();
  return itemStatuses.has(normalized) ? (normalized as ItemStatusValue) : "";
}
