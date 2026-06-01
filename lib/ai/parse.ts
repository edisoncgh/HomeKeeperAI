import {
  AI_FIELD_SOURCES,
  AiCandidateField,
  AiCandidateResponse,
  AiFieldSource,
  AiItemCandidate
} from "@/lib/ai/schemas";

type ParseAiCandidateResult = { data: AiCandidateResponse; ok: true } | { message: string; ok: false };
type CandidateKey = keyof Omit<AiItemCandidate, "name">;

interface FieldSpec {
  label: string;
  read: (value: unknown) => number | string | null;
}

const FIELD_SPECS = {
  categoryName: stringSpec("分类"),
  expiryDate: dateSpec("保质期"),
  expiryDays: integerSpec("保质期天数", 0),
  locationName: stringSpec("位置"),
  notes: stringSpec("备注"),
  purchaseDate: dateSpec("采购日期"),
  purchasePrice: numberSpec("采购价格", 0),
  quantity: integerSpec("数量", 1)
} satisfies Record<CandidateKey, FieldSpec>;

export function parseAiCandidateResponse(input: unknown): ParseAiCandidateResult {
  const json = parseJsonInput(input);
  if (!json.ok) {
    return { message: "LLM 返回内容无法解析，请重试或改为手动录入。", ok: false };
  }

  if (!isRecord(json.value) || !Array.isArray(json.value.candidates)) {
    return { message: "LLM 返回候选结构不正确，请重试或改为手动录入。", ok: false };
  }

  const warnings = readWarnings(json.value.warnings);
  const candidates = readCandidates(json.value.candidates, warnings);
  return { data: { candidates, warnings: uniqueWarnings(warnings) }, ok: true };
}

function readCandidates(values: unknown[], warnings: string[]) {
  const candidates: AiItemCandidate[] = [];
  values.forEach((value, index) => {
    const candidate = readCandidate(value, index + 1, warnings);
    if (candidate) {
      candidates.push(candidate);
    }
  });
  return candidates;
}

function readCandidate(value: unknown, index: number, warnings: string[]) {
  if (!isRecord(value)) {
    warnings.push(`第 ${index} 个候选格式不正确，已忽略。`);
    return null;
  }

  const name = readNameField(value.name, warnings);
  if (!name) {
    warnings.push(`第 ${index} 个候选缺少有效名称，已忽略。`);
    return null;
  }

  const candidate: AiItemCandidate = { name };
  addOptionalFields(candidate, value, warnings);
  addLowConfidenceWarnings(candidate, warnings);
  return candidate;
}

function addOptionalFields(candidate: AiItemCandidate, value: Record<string, unknown>, warnings: string[]) {
  (Object.keys(FIELD_SPECS) as CandidateKey[]).forEach((key) => {
    const field = readField(value[key], FIELD_SPECS[key], warnings, candidate.name.value);
    if (field) {
      Object.assign(candidate, { [key]: field });
    }
  });
}

function readField(
  value: unknown,
  spec: FieldSpec,
  warnings: string[],
  itemName?: string
): AiCandidateField<number | string> | null {
  if (value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }

  const source = readSource(value.source);
  const confidence = readConfidence(value.confidence);
  const fieldValue = spec.read(value.value);
  if (!source || confidence === null || fieldValue === null) {
    return null;
  }

  const reason = readReason(value.reason);
  if (source === "inference" && !reason) {
    warnings.push(`${itemName ?? "候选"} 的${spec.label}字段缺少推断说明，已忽略。`);
    return null;
  }

  return reason ? { confidence, reason, source, value: fieldValue } : { confidence, source, value: fieldValue };
}

function addLowConfidenceWarnings(candidate: AiItemCandidate, warnings: string[]) {
  Object.entries(FIELD_SPECS).forEach(([key, spec]) => {
    const field = candidate[key as CandidateKey];
    if (field && field.confidence < 0.4) {
      warnings.push(`${candidate.name.value} 的${spec.label}置信度较低，请人工确认。`);
    }
  });
}

function parseJsonInput(input: unknown): { ok: true; value: unknown } | { ok: false } {
  if (typeof input !== "string") {
    return { ok: true, value: input };
  }

  const jsonText = extractJsonText(input);
  if (!jsonText) {
    return { ok: false };
  }
  try {
    return { ok: true, value: JSON.parse(jsonText) };
  } catch {
    return { ok: false };
  }
}

function extractJsonText(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) {
    return fenced;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : null;
}

function readWarnings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function uniqueWarnings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function readNameField(value: unknown, warnings: string[]) {
  const field = readField(value, stringSpec("名称"), warnings);
  return field && typeof field.value === "string" ? { ...field, value: field.value } : null;
}

function readSource(value: unknown): AiFieldSource | null {
  const sources: readonly string[] = AI_FIELD_SOURCES;
  return typeof value === "string" && sources.includes(value) ? (value as AiFieldSource) : null;
}

function readConfidence(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 1 ? value : null;
}

function readReason(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringSpec(label: string): FieldSpec {
  return { label, read: (value) => (typeof value === "string" && value.trim() ? value.trim() : null) };
}

function integerSpec(label: string, min: number): FieldSpec {
  return { label, read: (value) => (typeof value === "number" && Number.isInteger(value) && value >= min ? value : null) };
}

function numberSpec(label: string, min: number): FieldSpec {
  return { label, read: (value) => (typeof value === "number" && value >= min ? value : null) };
}

function dateSpec(label: string): FieldSpec {
  return { label, read: (value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
