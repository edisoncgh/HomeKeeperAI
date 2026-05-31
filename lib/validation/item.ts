export type ItemStatusValue = "EXPIRED" | "EXPIRING" | "LOW_STOCK" | "NORMAL";
export type ItemSortField = "createdAt" | "expiryDate" | "name" | "quantity" | "updatedAt";

export interface ItemInput {
  categoryId: null | number;
  description: null | string;
  expiryDate: Date | null;
  imageUrl: null | string;
  locationId: null | number;
  name: string;
  notes: null | string;
  purchaseDate: Date | null;
  purchasePrice: null | number;
  quantity: number;
}

export interface ItemQuery {
  categoryId: null | number;
  locationId: null | number;
  order: "asc" | "desc";
  page: number;
  pageSize: number;
  q: string;
  sort: ItemSortField;
  status: ItemStatusValue | null;
}

type ValidationResult<T> = { data: T; ok: true } | { message: string; ok: false };

const MAX_TEXT_LENGTH = 500;
const MAX_NAME_LENGTH = 80;
const MAX_PAGE_SIZE = 100;
const itemStatuses = new Set(["EXPIRED", "EXPIRING", "LOW_STOCK", "NORMAL"]);
const itemSortFields = new Set(["createdAt", "expiryDate", "name", "quantity", "updatedAt"]);

export function parseItemInput(input: unknown): ValidationResult<ItemInput> {
  const source = getInputRecord(input);
  const name = normalizeString(source.name);

  if (!name) {
    return { message: "物品名称不能为空。", ok: false };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { message: "物品名称不能超过 80 个字符。", ok: false };
  }

  const parsed = parseInputFields(source);
  if (!parsed.ok) {
    return parsed;
  }

  return { data: { ...parsed.data, name }, ok: true };
}

export function parseItemQuery(searchParams: URLSearchParams): ValidationResult<ItemQuery> {
  const categoryId = parseOptionalPositiveInteger(searchParams.get("categoryId"));
  if (categoryId === "invalid") {
    return { message: "分类筛选参数不正确。", ok: false };
  }

  const locationId = parseOptionalPositiveInteger(searchParams.get("locationId"));
  if (locationId === "invalid") {
    return { message: "位置筛选参数不正确。", ok: false };
  }

  const parsed = parseQueryOptions(searchParams);
  if (!parsed.ok) {
    return parsed;
  }

  return { data: { ...parsed.data, categoryId, locationId }, ok: true };
}

function getInputRecord(input: unknown) {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function parseInputFields(source: Record<string, unknown>): ValidationResult<Omit<ItemInput, "name">> {
  const quantity = parseQuantity(source.quantity);
  if (quantity === null) {
    return { message: "数量必须是大于等于 1 的整数。", ok: false };
  }

  const dates = parseDates(source);
  if (!dates.ok) {
    return dates;
  }

  return buildItemInputFields(source, quantity, dates.data);
}

function buildItemInputFields(
  source: Record<string, unknown>,
  quantity: number,
  dates: Pick<ItemInput, "expiryDate" | "purchaseDate">
): ValidationResult<Omit<ItemInput, "name">> {
  const refs = parseInputReferences(source);
  if (!refs.ok) {
    return refs;
  }

  const price = parseOptionalNonNegativeNumber(source.purchasePrice);
  if (price === "invalid") {
    return { message: "采购价格不能小于 0。", ok: false };
  }

  return {
    data: {
      ...dates,
      categoryId: refs.data.categoryId,
      description: normalizeOptionalText(source.description),
      imageUrl: normalizeOptionalText(source.imageUrl),
      locationId: refs.data.locationId,
      notes: normalizeOptionalText(source.notes),
      purchasePrice: price,
      quantity
    },
    ok: true
  };
}

function parseInputReferences(
  source: Record<string, unknown>
): ValidationResult<Pick<ItemInput, "categoryId" | "locationId">> {
  const categoryId = parseOptionalPositiveInteger(source.categoryId);
  if (categoryId === "invalid") {
    return { message: "分类参数不正确。", ok: false };
  }

  const locationId = parseOptionalPositiveInteger(source.locationId);
  if (locationId === "invalid") {
    return { message: "位置参数不正确。", ok: false };
  }

  return { data: { categoryId, locationId }, ok: true };
}

function parseDates(source: Record<string, unknown>): ValidationResult<Pick<ItemInput, "expiryDate" | "purchaseDate">> {
  const expiryDate = parseOptionalDate(source.expiryDate);
  if (expiryDate === "invalid") {
    return { message: "保质期格式不正确。", ok: false };
  }

  const purchaseDate = parseOptionalDate(source.purchaseDate);
  if (purchaseDate === "invalid") {
    return { message: "采购日期格式不正确。", ok: false };
  }

  return { data: { expiryDate, purchaseDate }, ok: true };
}

function parseQueryOptions(searchParams: URLSearchParams): ValidationResult<Omit<ItemQuery, "categoryId" | "locationId">> {
  const status = parseStatus(searchParams.get("status"));
  if (status === "invalid") {
    return { message: "状态筛选参数不正确。", ok: false };
  }

  const sort = parseSort(searchParams.get("sort"));
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  return {
    data: {
      order,
      page: parsePositiveInteger(searchParams.get("page"), 1),
      pageSize: Math.min(parsePositiveInteger(searchParams.get("pageSize"), 20), MAX_PAGE_SIZE),
      q: normalizeString(searchParams.get("q")),
      sort,
      status
    },
    ok: true
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown) {
  const normalized = normalizeString(value);
  return normalized ? normalized.slice(0, MAX_TEXT_LENGTH) : null;
}

function parseQuantity(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 1;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

function parseOptionalDate(value: unknown) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00.000Z`)
    : new Date(normalized);

  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

function parseOptionalNonNegativeNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : "invalid";
}

function parseOptionalPositiveInteger(value: unknown) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : "invalid";
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : "invalid";
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed = parseOptionalPositiveInteger(value);
  return parsed === "invalid" || parsed === null ? fallback : parsed;
}

function parseStatus(value: unknown) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  return itemStatuses.has(normalized) ? (normalized as ItemStatusValue) : "invalid";
}

function parseSort(value: unknown) {
  const normalized = normalizeString(value);
  return itemSortFields.has(normalized) ? (normalized as ItemSortField) : "updatedAt";
}
