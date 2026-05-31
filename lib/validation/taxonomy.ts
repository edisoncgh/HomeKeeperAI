export interface TaxonomyInput {
  color: null | string;
  description: null | string;
  icon: null | string;
  name: string;
}

type ValidationResult<T> = { data: T; ok: true } | { message: string; ok: false };

const MAX_NAME_LENGTH = 40;
const MAX_OPTIONAL_LENGTH = 120;

export function parseTaxonomyInput(input: unknown): ValidationResult<TaxonomyInput> {
  const source = getInputRecord(input);
  const name = normalizeRequiredString(source.name);

  if (!name) {
    return { message: "名称不能为空。", ok: false };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { message: "名称不能超过 40 个字符。", ok: false };
  }

  const optionalFields = parseOptionalFields(source);
  if (!optionalFields.ok) {
    return optionalFields;
  }

  return {
    data: {
      ...optionalFields.data,
      name
    },
    ok: true
  };
}

function getInputRecord(input: unknown) {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseOptionalFields(source: Record<string, unknown>): ValidationResult<Omit<TaxonomyInput, "name">> {
  const fields = {
    color: normalizeOptionalString(source.color),
    description: normalizeOptionalString(source.description),
    icon: normalizeOptionalString(source.icon)
  };

  if (Object.values(fields).some((value) => value && value.length > MAX_OPTIONAL_LENGTH)) {
    return { message: "可选字段不能超过 120 个字符。", ok: false };
  }

  return { data: fields, ok: true };
}
